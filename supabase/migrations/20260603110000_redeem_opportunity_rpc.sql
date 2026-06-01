-- RPC atômica: resgatar oportunidade física

CREATE OR REPLACE FUNCTION public.redeem_physical_opportunity(
  p_opp_id UUID,
  p_token TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_opp public.physical_opportunities%ROWTYPE;
  v_saldo INTEGER;
  v_redemption_id UUID;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('error', 'nao_autorizado');
  END IF;
  IF p_token IS NULL OR length(trim(p_token)) < 8 THEN
    RETURN jsonb_build_object('error', 'token_invalido');
  END IF;

  SELECT * INTO v_opp FROM public.physical_opportunities WHERE id = p_opp_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'nao_encontrado');
  END IF;
  IF v_opp.quantidade_restante <= 0 THEN
    RETURN jsonb_build_object('error', 'esgotado');
  END IF;
  IF v_opp.valida_ate < NOW() OR v_opp.ativa = false THEN
    RETURN jsonb_build_object('error', 'expirado');
  END IF;

  SELECT balance INTO v_saldo FROM public.user_coins WHERE user_id = v_uid;
  IF v_saldo IS NULL OR v_saldo < v_opp.custo_moedas THEN
    RETURN jsonb_build_object('error', 'saldo_insuficiente');
  END IF;

  UPDATE public.user_coins
  SET balance = balance - v_opp.custo_moedas, updated_at = NOW()
  WHERE user_id = v_uid;

  UPDATE public.physical_opportunities
  SET quantidade_restante = quantidade_restante - 1
  WHERE id = p_opp_id;

  INSERT INTO public.physical_redemptions (
    oportunidade_id, user_id, moedas_gastas, qrcode_token, expira_em
  )
  VALUES (
    p_opp_id, v_uid, v_opp.custo_moedas, trim(p_token),
    NOW() + INTERVAL '48 hours'
  )
  RETURNING id INTO v_redemption_id;

  INSERT INTO public.coin_transactions (user_id, type, amount, reason, ref_id, bloqueado)
  VALUES (v_uid, 'spend', v_opp.custo_moedas, 'oportunidade_fisica', p_opp_id, false);

  RETURN jsonb_build_object(
    'success', true,
    'redemption_id', v_redemption_id,
    'token', trim(p_token)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.redeem_physical_opportunity(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_physical_opportunity(UUID, TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.confirm_physical_redemption(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_row public.physical_redemptions%ROWTYPE;
  v_opp public.physical_opportunities%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RETURN jsonb_build_object('error', 'nao_autorizado');
  END IF;

  SELECT r.* INTO v_row
  FROM public.physical_redemptions r
  WHERE r.qrcode_token = trim(p_token)
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'token_invalido');
  END IF;

  SELECT * INTO v_opp FROM public.physical_opportunities WHERE id = v_row.oportunidade_id;

  IF v_opp.empresa_id <> v_uid AND v_opp.empreendedor_id <> v_uid THEN
    RETURN jsonb_build_object('error', 'sem_permissao');
  END IF;

  IF v_row.status = 'confirmado' THEN
    RETURN jsonb_build_object('error', 'ja_utilizado');
  END IF;

  IF v_row.status <> 'pendente' OR v_row.expira_em < NOW() THEN
    UPDATE public.physical_redemptions SET status = 'expirado' WHERE id = v_row.id;
    RETURN jsonb_build_object('error', 'expirado');
  END IF;

  UPDATE public.physical_redemptions
  SET status = 'confirmado', confirmado_em = NOW(), confirmado_por = v_uid
  WHERE id = v_row.id;

  RETURN jsonb_build_object('success', true, 'redemption_id', v_row.id);
END;
$$;

REVOKE ALL ON FUNCTION public.confirm_physical_redemption(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.confirm_physical_redemption(TEXT) TO authenticated;

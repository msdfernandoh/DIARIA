CREATE TABLE IF NOT EXISTS public.user_coins (
  user_id       UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  balance       INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_earned  INTEGER NOT NULL DEFAULT 0 CHECK (total_earned >= 0),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.coin_transactions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('earn', 'spend')),
  amount      INTEGER NOT NULL CHECK (amount > 0),
  reason      VARCHAR(60) NOT NULL,
  ref_id      UUID,
  bloqueado   BOOLEAN NOT NULL DEFAULT false,
  libera_em   TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coin_tx_user ON public.coin_transactions (user_id, created_at DESC);

ALTER TABLE public.user_coins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coin_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_coins_own ON public.user_coins
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY coin_tx_select_own ON public.coin_transactions
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY coin_tx_insert_own ON public.coin_transactions
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND type = 'earn'
    AND reason IN (
      'cadastro_sem_codigo',
      'cadastro_com_codigo',
      'perfil_completo',
      'primeira_candidatura',
      'publicou_primeira_vaga'
    )
  );

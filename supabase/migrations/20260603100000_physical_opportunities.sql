-- Fase 2 — oportunidades físicas (brindes com QR)

CREATE TABLE public.physical_opportunities (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id          UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  empreendedor_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  titulo              VARCHAR(80) NOT NULL,
  descricao           TEXT,
  tipo                TEXT,
  foto_url            TEXT,
  custo_moedas        INTEGER NOT NULL CHECK (custo_moedas > 0),
  quantidade_total    INTEGER NOT NULL CHECK (quantidade_total > 0),
  quantidade_restante INTEGER NOT NULL CHECK (quantidade_restante >= 0),
  escopo              TEXT NOT NULL DEFAULT 'grupo' CHECK (escopo IN ('grupo', 'cidade')),
  grupo_id            UUID,
  cidade              VARCHAR(80),
  estado              CHAR(2),
  local_nome          VARCHAR(100),
  local_endereco      TEXT,
  lat                 DECIMAL(10, 7),
  lng                 DECIMAL(10, 7),
  valida_ate          TIMESTAMPTZ NOT NULL,
  ativa               BOOLEAN NOT NULL DEFAULT true,
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_physical_opportunities_feed
  ON public.physical_opportunities (cidade, ativa, valida_ate, quantidade_restante);

CREATE TABLE public.physical_redemptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oportunidade_id UUID NOT NULL REFERENCES public.physical_opportunities(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  moedas_gastas   INTEGER NOT NULL,
  qrcode_token    VARCHAR(64) NOT NULL UNIQUE,
  status          TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN (
                    'pendente', 'confirmado', 'expirado', 'cancelado'
                  )),
  resgatado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expira_em       TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '48 hours'),
  confirmado_em   TIMESTAMPTZ,
  confirmado_por  UUID REFERENCES public.users(id)
);

CREATE INDEX idx_physical_redemptions_token ON public.physical_redemptions (qrcode_token);
CREATE INDEX idx_physical_redemptions_user ON public.physical_redemptions (user_id, status);

ALTER TABLE public.physical_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.physical_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY physical_opportunities_read ON public.physical_opportunities
  FOR SELECT TO authenticated
  USING (ativa = true AND valida_ate > NOW());

CREATE POLICY physical_opportunities_manage ON public.physical_opportunities
  FOR ALL TO authenticated
  USING (empreendedor_id = auth.uid())
  WITH CHECK (empreendedor_id = auth.uid());

CREATE POLICY physical_redemptions_read_own ON public.physical_redemptions
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.physical_opportunities o
      WHERE o.id = oportunidade_id
      AND (o.empresa_id = auth.uid() OR o.empreendedor_id = auth.uid())
    )
  );

CREATE POLICY physical_redemptions_insert_own ON public.physical_redemptions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

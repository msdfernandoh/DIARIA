-- Diária da Cidade — Fase 1 (dev-briefing-completo.md)
-- Leads web + perfis + vagas + chat (sem moedas / oportunidades físicas)

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Leads das páginas (Vercel → Supabase, sem Zapier) ───
CREATE TABLE public.web_leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            VARCHAR(120) NOT NULL,
  celular         VARCHAR(20) NOT NULL,
  cidade          VARCHAR(80) NOT NULL,
  estado          CHAR(2),
  email           VARCHAR(120),
  tipo_interesse  TEXT NOT NULL CHECK (tipo_interesse IN (
                    'empregado','empregador','empreendedor','geral'
                  )),
  origem_pagina   TEXT NOT NULL CHECK (origem_pagina IN (
                    'institucional','trabalhe','contrate','parceiro'
                  )),
  utm_source      TEXT,
  utm_medium      TEXT,
  utm_campaign    TEXT,
  status          TEXT NOT NULL DEFAULT 'novo' CHECK (status IN (
                    'novo','contactado','convertido','descartado'
                  )),
  ip_hash         TEXT,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_web_leads_criado ON public.web_leads (criado_em DESC);
CREATE INDEX idx_web_leads_status ON public.web_leads (status, tipo_interesse);

ALTER TABLE public.web_leads ENABLE ROW LEVEL SECURITY;

-- Inserção pública apenas via service role (Edge Function) ou policy restrita:
-- anon pode INSERT com campos validados (fallback se não usar Edge Function)
CREATE POLICY web_leads_insert_anon ON public.web_leads
  FOR INSERT TO anon
  WITH CHECK (
    char_length(nome) BETWEEN 2 AND 120
    AND char_length(celular) BETWEEN 10 AND 20
    AND char_length(cidade) BETWEEN 2 AND 80
  );

CREATE POLICY web_leads_service_all ON public.web_leads
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ─── Perfil (1:1 com auth.users) ───
CREATE TABLE public.users (
  id                  UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome                VARCHAR(120) NOT NULL,
  celular             VARCHAR(20) NOT NULL,
  email               VARCHAR(120),
  cep                 VARCHAR(9),
  cidade              VARCHAR(80),
  estado              CHAR(2),
  bairro              VARCHAR(80),
  endereco            TEXT,
  lat                 DECIMAL(10,7),
  lng                 DECIMAL(10,7),
  tipo                TEXT NOT NULL CHECK (tipo IN (
                        'empregado','empregador','empreendedor',
                        'admin_regional','admin_master'
                      )),
  foto_url            TEXT,
  celular_visivel     BOOLEAN NOT NULL DEFAULT false,
  trabalha_presencial BOOLEAN NOT NULL DEFAULT true,
  trabalha_remoto     BOOLEAN NOT NULL DEFAULT false,
  ativo               BOOLEAN NOT NULL DEFAULT true,
  email_verificado    BOOLEAN NOT NULL DEFAULT false,
  termo_aceito_em     TIMESTAMPTZ,
  termo_versao        TEXT DEFAULT 'v1.0',
  ip_aceite           TEXT,
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ultimo_acesso       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX users_celular_unique ON public.users (celular) WHERE celular <> '';

CREATE INDEX idx_users_tipo_cidade ON public.users (tipo, cidade);
CREATE INDEX idx_users_celular ON public.users (celular);

CREATE TABLE public.user_availability (
  user_id           UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  dias_semana       INTEGER[] DEFAULT ARRAY[1,2,3,4,5],
  datas_especificas DATE[],
  turnos            TEXT[] DEFAULT ARRAY['manha','tarde'],
  raio_km           INTEGER NOT NULL DEFAULT 10,
  recorrente        BOOLEAN NOT NULL DEFAULT true,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.user_experiences (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  cargo       VARCHAR(80) NOT NULL,
  empresa     VARCHAR(80),
  periodo     VARCHAR(40),
  tipo        TEXT CHECK (tipo IN ('presencial','remoto','hibrido')),
  descricao   TEXT,
  ordem       INTEGER NOT NULL DEFAULT 0,
  criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.user_skills (
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  skill       VARCHAR(40) NOT NULL,
  PRIMARY KEY (user_id, skill)
);

CREATE TABLE public.user_highlights_tags (
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  tag         VARCHAR(40) NOT NULL,
  PRIMARY KEY (user_id, tag)
);

CREATE TABLE public.user_push_tokens (
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token       TEXT NOT NULL,
  plataforma  TEXT NOT NULL CHECK (plataforma IN ('ios','android')),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, token)
);

CREATE TABLE public.entrepreneurs (
  user_id             UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  codigo              VARCHAR(10) NOT NULL UNIQUE,
  nome_instancia      VARCHAR(80),
  cor_principal       CHAR(7) NOT NULL DEFAULT '#1D9E75',
  logo_url            TEXT,
  pix_chave           VARCHAR(120),
  pix_tipo            TEXT CHECK (pix_tipo IN ('cpf','cnpj','celular','email','aleatoria')),
  pix_banco           VARCHAR(60),
  pix_nome_conta      VARCHAR(80),
  tipo_pessoa         TEXT CHECK (tipo_pessoa IN ('pf','mei','cnpj')),
  documento           VARCHAR(20),
  periodo_gratis_fim  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '90 days'),
  status              TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN (
                        'ativo','em_risco','suspenso','encerrado'
                      )),
  meta_vagas          INTEGER NOT NULL DEFAULT 10,
  meta_pessoas        INTEGER NOT NULL DEFAULT 50,
  microfranquia       BOOLEAN NOT NULL DEFAULT false,
  microfranquia_em    TIMESTAMPTZ,
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.user_group (
  user_id           UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  empreendedor_id   UUID NOT NULL REFERENCES public.users(id),
  codigo_usado      VARCHAR(10) NOT NULL,
  vinculado_em      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ativo             BOOLEAN NOT NULL DEFAULT true
);

CREATE INDEX idx_user_group_empreendedor ON public.user_group (empreendedor_id, ativo);

CREATE TABLE public.commissions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empreendedor_id     UUID NOT NULL REFERENCES public.users(id),
  tipo                VARCHAR(60) NOT NULL,
  descricao           TEXT,
  valor_bruto         DECIMAL(10,2) NOT NULL,
  pct_empreendedor    DECIMAL(5,2) NOT NULL DEFAULT 90.00,
  valor_empreendedor  DECIMAL(10,2),
  valor_plataforma    DECIMAL(10,2),
  taxa_acumulada      DECIMAL(10,2) NOT NULL DEFAULT 0,
  status              TEXT NOT NULL DEFAULT 'pendente',
  pago_em             TIMESTAMPTZ,
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.jobs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empregador_id       UUID NOT NULL REFERENCES public.users(id),
  titulo              VARCHAR(120) NOT NULL,
  descricao           TEXT,
  requisitos          TEXT,
  categoria           VARCHAR(60) NOT NULL,
  tipo                TEXT CHECK (tipo IN ('diaria','emprego_fixo','remoto')),
  formato             TEXT CHECK (formato IN ('presencial','remoto','hibrido')),
  contrato            TEXT CHECK (contrato IN ('clt','pj','estagio','aprendiz','diaria')),
  data_inicio         DATE,
  data_fim            DATE,
  horario_inicio      TIME,
  horario_fim         TIME,
  recorrente          BOOLEAN NOT NULL DEFAULT false,
  dias_recorrencia    INTEGER[],
  recorrencia_ate     DATE,
  valor               DECIMAL(10,2),
  vagas_total         INTEGER NOT NULL DEFAULT 1,
  vagas_restantes     INTEGER NOT NULL DEFAULT 1,
  cep                 VARCHAR(9),
  cidade              VARCHAR(80),
  estado              CHAR(2),
  endereco            TEXT,
  lat                 DECIMAL(10,7),
  lng                 DECIMAL(10,7),
  urgente             BOOLEAN NOT NULL DEFAULT false,
  beneficios          TEXT[],
  destaque_nivel      TEXT NOT NULL DEFAULT 'organico' CHECK (destaque_nivel IN (
                        'organico','grupo','cidade','estado','brasil'
                      )),
  destaque_grupo_id   UUID,
  destaque_ate        TIMESTAMPTZ,
  ativa               BOOLEAN NOT NULL DEFAULT true,
  pausada             BOOLEAN NOT NULL DEFAULT false,
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jobs_feed ON public.jobs (cidade, ativa, destaque_nivel, urgente, criado_em DESC);
CREATE INDEX idx_jobs_grupo ON public.jobs (destaque_grupo_id, destaque_nivel, destaque_ate);

CREATE TABLE public.applications (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id           UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  candidato_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status           TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN (
                     'pendente','aceita','recusada','concluida','cancelada'
                   )),
  mensagem_inicial TEXT,
  criado_em        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  atualizado_em    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (job_id, candidato_id)
);

CREATE INDEX idx_applications_job ON public.applications (job_id, status);
CREATE INDEX idx_applications_candidato ON public.applications (candidato_id, status);

CREATE TABLE public.messages (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  sender_id       UUID NOT NULL REFERENCES public.users(id),
  texto           TEXT NOT NULL,
  tipo            TEXT NOT NULL DEFAULT 'texto' CHECK (tipo IN (
                    'texto','sistema','celular_compartilhado'
                  )),
  lida            BOOLEAN NOT NULL DEFAULT false,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_application ON public.messages (application_id, criado_em DESC);

CREATE TABLE public.ratings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  avaliador_id    UUID NOT NULL REFERENCES public.users(id),
  avaliado_id     UUID NOT NULL REFERENCES public.users(id),
  nota            INTEGER NOT NULL CHECK (nota BETWEEN 1 AND 5),
  topicos         TEXT[],
  comentario      TEXT,
  criado_em       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (application_id, avaliador_id)
);

CREATE INDEX idx_ratings_avaliado ON public.ratings (avaliado_id, nota, criado_em DESC);

CREATE TABLE public.highlights (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_entidade       TEXT NOT NULL CHECK (tipo_entidade IN (
                        'vaga','candidato','banner','oportunidade'
                      )),
  entidade_id         UUID,
  nivel               TEXT NOT NULL CHECK (nivel IN ('grupo','cidade','estado','brasil')),
  grupo_id            UUID,
  empreendedor_id     UUID NOT NULL REFERENCES public.users(id),
  valor_cobrado       DECIMAL(10,2),
  pago_via            TEXT NOT NULL DEFAULT 'pix',
  status_pagamento    TEXT NOT NULL DEFAULT 'pendente',
  ativo_de            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ativo_ate           TIMESTAMPTZ,
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_highlights_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entrepreneurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_group ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.highlights ENABLE ROW LEVEL SECURITY;

CREATE POLICY users_select_own ON public.users
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY users_update_own ON public.users
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY users_insert_own ON public.users
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

CREATE POLICY jobs_read_active ON public.jobs
  FOR SELECT TO authenticated USING (ativa = true AND pausada = false);

CREATE POLICY jobs_write_owner ON public.jobs
  FOR ALL TO authenticated USING (auth.uid() = empregador_id) WITH CHECK (auth.uid() = empregador_id);

CREATE POLICY applications_participant ON public.applications
  FOR ALL TO authenticated USING (
    auth.uid() = candidato_id
    OR EXISTS (
      SELECT 1 FROM public.jobs j
      WHERE j.id = job_id AND j.empregador_id = auth.uid()
    )
  );

CREATE POLICY messages_participants ON public.messages
  FOR ALL TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.applications a
      WHERE a.id = application_id
      AND (
        a.candidato_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.jobs j
          WHERE j.id = a.job_id AND j.empregador_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY availability_own ON public.user_availability
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY skills_own ON public.user_skills
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY experiences_own ON public.user_experiences
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY highlights_tags_own ON public.user_highlights_tags
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY push_tokens_own ON public.user_push_tokens
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY entrepreneurs_read ON public.entrepreneurs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY entrepreneurs_write_own ON public.entrepreneurs
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_group_read ON public.user_group
  FOR SELECT TO authenticated USING (
    auth.uid() = user_id OR auth.uid() = empreendedor_id
  );

CREATE POLICY commissions_entrepreneur ON public.commissions
  FOR SELECT TO authenticated USING (auth.uid() = empreendedor_id);

CREATE POLICY ratings_read ON public.ratings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY ratings_insert ON public.ratings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = avaliador_id);

-- Realtime para chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

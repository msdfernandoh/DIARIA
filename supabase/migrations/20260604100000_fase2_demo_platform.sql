-- F2-05 demo jobs + F2-07 platform_config + perfil bio

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS bio TEXT;

ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.platform_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.platform_config (key, value)
VALUES
  ('growth_pct', '34'),
  ('fase_atual', '1'),
  ('taxa_plataforma_pct', '10'),
  ('taxa_gratis_dias', '90')
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.platform_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY platform_config_read ON public.platform_config
  FOR SELECT TO authenticated USING (true);

CREATE POLICY platform_config_admin ON public.platform_config
  FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.tipo = 'admin_master')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.tipo = 'admin_master')
  );

CREATE POLICY jobs_read_demo_anon ON public.jobs
  FOR SELECT TO anon
  USING (is_demo = true AND ativa = true);

-- Vagas demo (só se existir algum empregador)
DO $$
DECLARE
  eid UUID;
BEGIN
  SELECT id INTO eid FROM public.users WHERE tipo = 'empregador' LIMIT 1;
  IF eid IS NULL THEN
    SELECT id INTO eid FROM public.users LIMIT 1;
  END IF;
  IF eid IS NULL THEN
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.jobs WHERE is_demo = true LIMIT 1) THEN
    INSERT INTO public.jobs (
      empregador_id, titulo, categoria, formato, valor, cidade, estado,
      urgente, vagas_total, vagas_restantes, ativa, is_demo, data_inicio
    ) VALUES
      (eid, 'Garçom urgente hoje', 'Alimentação', 'presencial', 180, 'Sinop', 'MT', true, 3, 3, true, true, CURRENT_DATE),
      (eid, 'Diarista sexta', 'Limpeza', 'presencial', 160, 'Sinop', 'MT', false, 2, 2, true, true, CURRENT_DATE + 2),
      (eid, 'Churrasqueiro sábado', 'Alimentação', 'presencial', 280, 'Sinop', 'MT', false, 1, 1, true, true, CURRENT_DATE + 3),
      (eid, 'Chapa de mudança amanhã', 'Geral', 'presencial', 200, 'Sinop', 'MT', true, 2, 2, true, true, CURRENT_DATE + 1),
      (eid, 'Atendente home office', 'Administrativo', 'remoto', 120, 'Remoto', 'MT', false, 5, 5, true, true, CURRENT_DATE),
      (eid, 'Cabo eleitoral semana', 'Geral', 'presencial', 220, 'Sinop', 'MT', false, 10, 10, true, true, CURRENT_DATE);
  END IF;
END $$;

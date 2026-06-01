ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS tipo_contratante TEXT CHECK (
    tipo_contratante IS NULL OR tipo_contratante IN ('pessoa_fisica', 'mei', 'empresa')
  ),
  ADD COLUMN IF NOT EXISTS razao_social VARCHAR(160),
  ADD COLUMN IF NOT EXISTS cnpj VARCHAR(18),
  ADD COLUMN IF NOT EXISTS nome_fantasia VARCHAR(120),
  ADD COLUMN IF NOT EXISTS segmento TEXT,
  ADD COLUMN IF NOT EXISTS destaque_gratis_ate TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS filtro_avancado_ate TIMESTAMPTZ;

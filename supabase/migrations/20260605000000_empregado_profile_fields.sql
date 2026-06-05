-- Campos de perfil profissional do empregado (onboarding passos 4–7)

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS valor_min_dia DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS valor_max_dia DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS tem_moto BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tem_carro BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tem_van BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tem_bicicleta BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.user_availability
  ADD COLUMN IF NOT EXISTS disponivel_qualquer_dia BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS horas_por_dia INTEGER NOT NULL DEFAULT 8,
  ADD COLUMN IF NOT EXISTS horas_por_semana INTEGER NOT NULL DEFAULT 40,
  ADD COLUMN IF NOT EXISTS tipo_jornada TEXT[] NOT NULL DEFAULT ARRAY['diarias_avulsas'];

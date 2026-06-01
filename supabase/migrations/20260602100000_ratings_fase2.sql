-- Fase 2 — avaliações pós-diária

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS nota_media DECIMAL(3, 1);

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS avaliacao_expires_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.applications_set_rating_deadline()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'concluida' AND (OLD.status IS DISTINCT FROM 'concluida') THEN
    NEW.avaliacao_expires_at := NOW() + INTERVAL '48 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS applications_rating_deadline ON public.applications;
CREATE TRIGGER applications_rating_deadline
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.applications_set_rating_deadline();

CREATE OR REPLACE FUNCTION public.refresh_user_nota_media()
RETURNS TRIGGER AS $$
DECLARE
  target UUID;
BEGIN
  target := COALESCE(NEW.avaliado_id, OLD.avaliado_id);
  UPDATE public.users
  SET nota_media = (
    SELECT ROUND(AVG(nota)::numeric, 1)
    FROM public.ratings
    WHERE avaliado_id = target
  )
  WHERE id = target;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS ratings_refresh_nota_media ON public.ratings;
CREATE TRIGGER ratings_refresh_nota_media
  AFTER INSERT OR UPDATE OR DELETE ON public.ratings
  FOR EACH ROW
  EXECUTE FUNCTION public.refresh_user_nota_media();

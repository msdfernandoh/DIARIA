-- Validação pública de código de empreendedor (formulário web antes do login)
CREATE OR REPLACE FUNCTION public.validate_entrepreneur_code_public(p_codigo text)
RETURNS TABLE (user_id uuid, nome_instancia text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT e.user_id, e.nome_instancia
  FROM public.entrepreneurs e
  WHERE upper(trim(e.codigo)) = upper(trim(p_codigo))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.validate_entrepreneur_code_public(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_entrepreneur_code_public(text) TO anon, authenticated;

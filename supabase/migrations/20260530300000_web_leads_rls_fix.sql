-- Garantir insert público de leads (site Vercel usa anon key + REST)
-- Execute no SQL Editor se o formulário retornar 403.

ALTER TABLE public.web_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS web_leads_insert_anon ON public.web_leads;
CREATE POLICY web_leads_insert_anon ON public.web_leads
  FOR INSERT TO anon
  WITH CHECK (
    char_length(nome) BETWEEN 2 AND 120
    AND char_length(celular) BETWEEN 10 AND 20
    AND char_length(cidade) BETWEEN 2 AND 80
  );

-- Leitura só service role / dashboard (anon não lista leads)
DROP POLICY IF EXISTS web_leads_select_anon ON public.web_leads;

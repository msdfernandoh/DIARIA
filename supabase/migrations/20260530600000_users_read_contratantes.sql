CREATE POLICY users_read_contratantes ON public.users
  FOR SELECT TO authenticated
  USING (tipo IN ('empregador', 'empreendedor') OR auth.uid() = id);

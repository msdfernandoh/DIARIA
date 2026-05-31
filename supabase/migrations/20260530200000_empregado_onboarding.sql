ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS onboarding_completo BOOLEAN NOT NULL DEFAULT false;

CREATE POLICY user_group_insert_own ON public.user_group
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Empregado valida código e vincula grupo (só o próprio user_id)
CREATE POLICY user_group_update_own ON public.user_group
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

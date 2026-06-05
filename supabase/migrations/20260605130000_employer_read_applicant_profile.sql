-- Empregador pode ver skills e disponibilidade de candidatos às próprias vagas (app minhas-vagas)

CREATE POLICY skills_read_job_applicants ON public.user_skills
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.applications a
      INNER JOIN public.jobs j ON j.id = a.job_id
      WHERE a.candidato_id = user_skills.user_id
        AND j.empregador_id = auth.uid()
    )
  );

CREATE POLICY availability_read_job_applicants ON public.user_availability
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.applications a
      INNER JOIN public.jobs j ON j.id = a.job_id
      WHERE a.candidato_id = user_availability.user_id
        AND j.empregador_id = auth.uid()
    )
  );

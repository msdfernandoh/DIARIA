-- Web empregador: listar próprias vagas (incl. encerradas) e ver dados de candidatos
CREATE POLICY jobs_read_owner ON public.jobs
  FOR SELECT TO authenticated
  USING (auth.uid() = empregador_id);

CREATE POLICY users_read_job_applicants ON public.users
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.applications a
      INNER JOIN public.jobs j ON j.id = a.job_id
      WHERE a.candidato_id = users.id
        AND j.empregador_id = auth.uid()
    )
  );

function formatDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function formatMoney(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function categoryLabel(id) {
  const c = (window.JOB_CATEGORIES || []).find((x) => x.id === id);
  return c ? `${c.emoji} ${c.label}` : id;
}

function isJobExpired(job) {
  if (!job.ativa) return true;
  if (job.data_fim) return job.data_fim < todayIso();
  if (job.data_inicio) return job.data_inicio < todayIso();
  return false;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

async function loadJobs(userId) {
  const sb = EmpregadorAuth.getSupabase();
  const { data: jobs, error } = await sb
    .from("jobs")
    .select("id, titulo, categoria, data_inicio, valor, ativa, criado_em")
    .eq("empregador_id", userId)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return jobs || [];
}

async function countApplications(jobIds) {
  if (!jobIds.length) return {};
  const sb = EmpregadorAuth.getSupabase();
  const { data, error } = await sb.from("applications").select("job_id").in("job_id", jobIds);
  if (error) throw error;
  const map = {};
  (data || []).forEach((row) => {
    map[row.job_id] = (map[row.job_id] || 0) + 1;
  });
  return map;
}

async function fetchCandidates(jobId) {
  const sb = EmpregadorAuth.getSupabase();
  const { data, error } = await sb
    .from("applications")
    .select("id, candidato_id, users ( nome, celular )")
    .eq("job_id", jobId);
  if (error) throw error;
  return data || [];
}

async function closeJob(jobId) {
  const sb = EmpregadorAuth.getSupabase();
  const { error } = await sb.from("jobs").update({ ativa: false }).eq("id", jobId);
  if (error) throw error;
}

function renderEmpty() {
  const list = document.getElementById("jobs-list");
  list.innerHTML = `
    <p class="sub" style="text-align:center;margin:24px 0;">Você ainda não publicou nenhuma vaga.</p>
    <a href="/publicar-vaga.html" class="btn-primary" style="display:block;text-align:center;text-decoration:none;">Publicar primeira vaga</a>
  `;
}

function renderJobs(jobs, counts) {
  const list = document.getElementById("jobs-list");
  if (!jobs.length) {
    renderEmpty();
    return;
  }
  list.innerHTML = jobs
    .map((job) => {
      const expired = isJobExpired(job);
      const badge = expired
        ? '<span class="badge badge-off">Expirada</span>'
        : '<span class="badge badge-ativa">Ativa</span>';
      const n = counts[job.id] || 0;
      return `
        <article class="job-card" data-job-id="${job.id}">
          <h3>${escapeHtml(job.titulo)}</h3>
          <div class="job-meta">
            ${badge}
            ${escapeHtml(categoryLabel(job.categoria))} · ${formatDate(job.data_inicio)} · ${formatMoney(job.valor)}
          </div>
          <div class="job-meta">${n} candidato${n === 1 ? "" : "s"}</div>
          <div class="job-actions">
            <button type="button" data-action="candidatos">Ver candidatos</button>
            ${job.ativa ? '<button type="button" data-action="encerrar">Encerrar vaga</button>' : ""}
          </div>
          <div class="candidates-panel panel-hidden" id="cand-${job.id}"></div>
        </article>
      `;
    })
    .join("");

  list.querySelectorAll("[data-action=candidatos]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const card = btn.closest(".job-card");
      const jobId = card?.dataset.jobId;
      const panel = document.getElementById(`cand-${jobId}`);
      if (!panel) return;
      if (!panel.classList.contains("panel-hidden")) {
        panel.classList.add("panel-hidden");
        return;
      }
      panel.textContent = "Carregando…";
      panel.classList.remove("panel-hidden");
      try {
        const rows = await fetchCandidates(jobId);
        if (!rows.length) {
          panel.innerHTML = '<p class="job-meta" style="margin-top:8px;">Nenhum candidato ainda.</p>';
          return;
        }
        panel.innerHTML =
          '<ul style="margin-top:10px;padding-left:0;list-style:none;">' +
          rows
            .map((r) => {
              const u = r.users || {};
              const cel = u.celular
                ? String(u.celular).replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3")
                : "—";
              return `<li class="job-meta" style="margin-bottom:6px;"><strong>${escapeHtml(u.nome || "Candidato")}</strong> · ${escapeHtml(cel)}</li>`;
            })
            .join("") +
          "</ul>";
      } catch (e) {
        panel.innerHTML = `<p class="job-meta" style="color:#DC2626;">${escapeHtml(e.message || "Erro ao carregar.")}</p>`;
      }
    });
  });

  list.querySelectorAll("[data-action=encerrar]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const card = btn.closest(".job-card");
      const jobId = card?.dataset.jobId;
      if (!jobId || !confirm("Encerrar esta vaga? Ela deixa de aparecer no app.")) return;
      btn.disabled = true;
      try {
        await closeJob(jobId);
        window.location.reload();
      } catch (e) {
        alert(e.message || "Não foi possível encerrar.");
        btn.disabled = false;
      }
    });
  });
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

document.addEventListener("DOMContentLoaded", async () => {
  EmpregadorAuth.initWebHeader();
  const user = await EmpregadorAuth.requireAuth("/contrate.html");
  if (!user) return;

  const profile = await EmpregadorAuth.fetchEmployerProfile(user.id);
  const hello = document.getElementById("hello-name");
  if (hello) hello.textContent = profile?.nome?.split(" ")[0] || "Olá";

  document.getElementById("btn-nova")?.addEventListener("click", () => {
    window.location.href = "/publicar-vaga.html";
  });
  document.getElementById("btn-sair")?.addEventListener("click", async () => {
    await EmpregadorAuth.signOutEmployer();
    window.location.href = "/contrate.html";
  });

  try {
    const jobs = await loadJobs(user.id);
    const counts = await countApplications(jobs.map((j) => j.id));
    renderJobs(jobs, counts);
  } catch (e) {
    const list = document.getElementById("jobs-list");
    list.innerHTML = `<p class="form-msg err">${escapeHtml(e.message || "Erro ao carregar vagas.")}</p>`;
  }
});

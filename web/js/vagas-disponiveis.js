const FILTERS = [
  { id: "todos", label: "Todos" },
  { id: "urgente", label: "⚡ Urgente" },
  { id: "remoto", label: "🏠 Home Office" },
  { id: "presencial", label: "📍 Presencial" },
  { id: "limpeza", label: "🧹 Limpeza" },
  { id: "garcom", label: "🍽️ Garçom" },
  { id: "churrasco", label: "🔥 Churrasco" },
  { id: "chapa", label: "💪 Chapa" },
  { id: "obras", label: "🔨 Obras" },
  { id: "motoboy", label: "🏍️ Motoboy" },
  { id: "eleitoral", label: "🗳️ Eleitoral" },
  { id: "vendas", label: "💼 Vendas" },
];

let allJobs = [];
let appliedJobIds = new Set();
let activeFilter = "todos";
let searchText = "";
let userProfile = null;
let nationwide = false;
let pendingApplyJob = null;

function categoryLabel(id) {
  const c = (window.JOB_CATEGORIES || []).find((x) => x.id === id);
  return c ? `${c.emoji} ${c.label}` : id;
}

function formatDate(iso) {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function formatTime(t) {
  if (!t) return "";
  return String(t).slice(0, 5);
}

function formatMoney(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function truncate(s, max) {
  const t = String(s || "");
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function haversineKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return null;
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function loadApplied(userId) {
  const sb = TrabalhadorAuth.getSupabase();
  const { data, error } = await sb.from("applications").select("job_id").eq("candidato_id", userId);
  if (error) throw error;
  appliedJobIds = new Set((data || []).map((r) => r.job_id));
}

async function loadJobs() {
  const sb = TrabalhadorAuth.getSupabase();
  let q = sb
    .from("jobs")
    .select(
      "id, titulo, descricao, categoria, formato, urgente, valor, data_inicio, horario_inicio, horario_fim, cidade, lat, lng, empregador_id, users!jobs_empregador_id_fkey ( nome )"
    )
    .eq("ativa", true)
    .gt("vagas_restantes", 0)
    .eq("is_demo", false)
    .order("urgente", { ascending: false })
    .order("criado_em", { ascending: false })
    .limit(50);

  const { data, error } = await q;
  if (error) throw error;
  allJobs = data || [];
}

function filterJobs() {
  const cidade = userProfile?.cidade || "";
  return allJobs.filter((job) => {
    if (!nationwide && cidade) {
      const localOk =
        job.formato === "remoto" ||
        (job.cidade && job.cidade.toLowerCase() === cidade.toLowerCase());
      if (!localOk) return false;
    }
    if (searchText) {
      const hay = `${job.titulo} ${job.descricao || ""} ${job.cidade || ""}`.toLowerCase();
      if (!hay.includes(searchText.toLowerCase())) return false;
    }
    if (activeFilter === "urgente" && !job.urgente) return false;
    if (activeFilter === "remoto" && job.formato !== "remoto") return false;
    if (activeFilter === "presencial" && job.formato === "remoto") return false;
    if (
      !["todos", "urgente", "remoto", "presencial"].includes(activeFilter) &&
      job.categoria !== activeFilter
    ) {
      return false;
    }
    return true;
  });
}

function renderFilters() {
  const el = document.getElementById("filter-chips");
  if (!el) return;
  el.innerHTML = FILTERS.map(
    (f) =>
      `<button type="button" class="filter-chip ${f.id === activeFilter ? "on" : ""}" data-filter="${f.id}">${TrabalhadorAuth.escapeHtml(f.label)}</button>`
  ).join("");
  el.querySelectorAll("[data-filter]").forEach((btn) => {
    btn.addEventListener("click", () => {
      activeFilter = btn.dataset.filter || "todos";
      renderFilters();
      renderJobsList();
    });
  });
}

function renderJobsList() {
  const list = document.getElementById("jobs-list");
  const empty = document.getElementById("empty-state");
  if (!list) return;
  const jobs = filterJobs().slice(0, 20);

  if (!jobs.length) {
    list.innerHTML = "";
    if (empty) empty.classList.remove("panel-hidden");
    return;
  }
  if (empty) empty.classList.add("panel-hidden");

  list.innerHTML = jobs
    .map((job) => {
      const emp = job.users?.nome || "Contratante";
      const dist = haversineKm(
        userProfile?.lat,
        userProfile?.lng,
        job.lat,
        job.lng
      );
      const distTxt =
        dist != null ? ` · ~${dist.toFixed(1)} km` : "";
      const applied = appliedJobIds.has(job.id);
      const badges = [
        job.urgente ? '<span class="badge badge-urgente">🔴 Urgente</span>' : "",
        job.formato === "remoto" ? '<span class="badge badge-remoto">🏠 Home Office</span>' : "",
      ].join("");
      const horario =
        job.horario_inicio || job.horario_fim
          ? `${formatTime(job.horario_inicio)}${job.horario_fim ? "–" + formatTime(job.horario_fim) : ""}`
          : "Combinar";
      return `
        <article class="job-card" data-job-id="${job.id}">
          <div class="job-badges">${badges}</div>
          <h3>${categoryLabel(job.categoria)} ${TrabalhadorAuth.escapeHtml(job.titulo)}</h3>
          <div class="job-meta">${TrabalhadorAuth.escapeHtml(emp)} · ${TrabalhadorAuth.escapeHtml(job.cidade || "Remoto")}${distTxt}</div>
          <div class="job-meta">📅 ${formatDate(job.data_inicio)} · ⏰ ${horario}</div>
          <div class="job-valor">${formatMoney(job.valor)}/dia</div>
          <p class="job-desc">${TrabalhadorAuth.escapeHtml(truncate(job.descricao, 100))}</p>
          ${
            applied
              ? '<button type="button" class="btn-applied" disabled>✅ Candidatura enviada</button>'
              : `<button type="button" class="btn-apply" data-apply="${job.id}">Me candidatar</button>`
          }
        </article>
      `;
    })
    .join("");

  list.querySelectorAll("[data-apply]").forEach((btn) => {
    btn.addEventListener("click", () => openApplyModal(btn.dataset.apply));
  });
}

function openApplyModal(jobId) {
  const job = allJobs.find((j) => j.id === jobId);
  if (!job) return;
  pendingApplyJob = job;
  const modal = document.getElementById("apply-modal");
  const body = document.getElementById("apply-modal-body");
  const emp = job.users?.nome || "Contratante";
  if (body) {
    body.innerHTML = `
      <p class="job-meta" style="margin-bottom:8px;"><strong>${TrabalhadorAuth.escapeHtml(job.titulo)}</strong></p>
      <p class="job-meta">${TrabalhadorAuth.escapeHtml(emp)} · ${formatMoney(job.valor)}/dia · ${formatDate(job.data_inicio)}</p>
    `;
  }
  const ta = document.getElementById("apply-message");
  if (ta) ta.value = "Olá! Tenho interesse nesta vaga.";
  modal?.classList.remove("panel-hidden");
}

function closeApplyModal() {
  document.getElementById("apply-modal")?.classList.add("panel-hidden");
  pendingApplyJob = null;
}

function showToast(text) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = text;
  t.classList.remove("panel-hidden");
  setTimeout(() => t.classList.add("panel-hidden"), 3500);
}

async function confirmApply(userId) {
  if (!pendingApplyJob) return;
  const btn = document.getElementById("btn-confirm-apply");
  btn.disabled = true;
  const msg =
    document.getElementById("apply-message")?.value?.trim() ||
    "Olá! Tenho interesse nesta vaga.";
  const sb = TrabalhadorAuth.getSupabase();
  try {
    const { data: app, error: appErr } = await sb
      .from("applications")
      .insert({
        job_id: pendingApplyJob.id,
        candidato_id: userId,
        status: "pendente",
        mensagem_inicial: msg,
      })
      .select("id")
      .single();
    if (appErr) throw appErr;

    const { error: msgErr } = await sb.from("messages").insert({
      application_id: app.id,
      sender_id: userId,
      texto: "💼 Candidatura enviada via web",
      tipo: "sistema",
    });
    if (msgErr) throw msgErr;

    appliedJobIds.add(pendingApplyJob.id);
    closeApplyModal();
    showToast("Candidatura enviada! O contratante vai te contatar.");
    renderJobsList();
  } catch (e) {
    alert(e.message || "Não foi possível enviar a candidatura.");
  } finally {
    btn.disabled = false;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  if (window.WebNav) WebNav.initWebNav();
  const user = await TrabalhadorAuth.requireWorkerAuth("/trabalhe.html");
  if (!user) return;

  userProfile = await TrabalhadorAuth.fetchWorkerProfile(user.id);
  const hello = document.getElementById("hello-name");
  if (hello) hello.textContent = userProfile?.nome?.split(" ")[0] || "Olá";

  document.getElementById("btn-sair")?.addEventListener("click", async () => {
    await TrabalhadorAuth.signOutWorker();
    window.location.href = "/trabalhe.html";
  });

  document.getElementById("job-search")?.addEventListener("input", (e) => {
    searchText = e.target.value.trim();
    renderJobsList();
  });

  document.getElementById("btn-nationwide")?.addEventListener("click", () => {
    nationwide = true;
    renderJobsList();
  });

  document.getElementById("btn-confirm-apply")?.addEventListener("click", () => {
    void confirmApply(user.id);
  });
  document.getElementById("btn-cancel-apply")?.addEventListener("click", closeApplyModal);
  document.getElementById("apply-modal")?.addEventListener("click", (e) => {
    if (e.target.id === "apply-modal") closeApplyModal();
  });

  renderFilters();
  try {
    await loadApplied(user.id);
    await loadJobs();
    renderJobsList();
  } catch (e) {
    const list = document.getElementById("jobs-list");
    if (list) {
      list.innerHTML = `<p class="form-msg err">${TrabalhadorAuth.escapeHtml(e.message || "Erro ao carregar vagas.")}</p>`;
    }
  }
});

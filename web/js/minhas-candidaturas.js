const STATUS_LABELS = {
  pendente: { cls: "status-pendente", text: "🟡 Aguardando resposta" },
  aceita: { cls: "status-aceita", text: "🟢 Aceita! Entre em contato" },
  recusada: { cls: "status-recusada", text: "🔴 Não selecionado" },
  concluida: { cls: "status-concluida", text: "✅ Concluída" },
  cancelada: { cls: "status-recusada", text: "Cancelada" },
};

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

function maskCelular(c) {
  const d = String(c || "").replace(/\D/g, "");
  if (d.length < 10) return c || "—";
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function waLink(celular, titulo) {
  const d = String(celular || "").replace(/\D/g, "");
  const text = encodeURIComponent(`Olá! Vi que aceitou minha candidatura para "${titulo}".`);
  return `https://wa.me/55${d}?text=${text}`;
}

async function loadApplications(userId) {
  const sb = TrabalhadorAuth.getSupabase();
  const { data, error } = await sb
    .from("applications")
    .select(
      "id, status, criado_em, job_id, jobs ( titulo, valor, data_inicio, empregador_id, users!jobs_empregador_id_fkey ( nome, celular, celular_visivel ) )"
    )
    .eq("candidato_id", userId)
    .order("criado_em", { ascending: false });
  if (error) throw error;
  return data || [];
}

function renderList(rows) {
  const list = document.getElementById("candidaturas-list");
  if (!list) return;
  if (!rows.length) {
    list.innerHTML = `
      <div class="empty-state">
        <p>Você ainda não se candidatou a nenhuma vaga.</p>
        <a href="/vagas-disponiveis.html" class="btn-primary" style="display:inline-block;text-align:center;text-decoration:none;max-width:280px;">Ver vagas disponíveis</a>
      </div>
    `;
    return;
  }

  list.innerHTML = rows
    .map((row) => {
      const job = row.jobs || {};
      const emp = job.users || {};
      const st = STATUS_LABELS[row.status] || STATUS_LABELS.pendente;
      const showWa =
        row.status === "aceita" &&
        emp.celular_visivel &&
        emp.celular;
      return `
        <article class="job-card">
          <h3>${TrabalhadorAuth.escapeHtml(job.titulo || "Vaga")}</h3>
          <div class="job-meta">${TrabalhadorAuth.escapeHtml(emp.nome || "Contratante")}</div>
          <div class="job-meta">${formatDate(job.data_inicio)} · ${formatMoney(job.valor)}</div>
          <span class="badge ${st.cls}">${st.text}</span>
          ${
            showWa
              ? `<p class="job-meta" style="margin-top:10px;">📱 ${TrabalhadorAuth.escapeHtml(maskCelular(emp.celular))}</p>
                 <a class="btn-wa" href="${waLink(emp.celular, job.titulo)}" target="_blank" rel="noopener">WhatsApp</a>`
              : ""
          }
        </article>
      `;
    })
    .join("");
}

document.addEventListener("DOMContentLoaded", async () => {
  if (window.WebNav) WebNav.initWebNav();
  const user = await TrabalhadorAuth.requireWorkerAuth("/trabalhe.html");
  if (!user) return;

  document.getElementById("btn-sair")?.addEventListener("click", async () => {
    await TrabalhadorAuth.signOutWorker();
    window.location.href = "/trabalhe.html";
  });

  try {
    const rows = await loadApplications(user.id);
    renderList(rows);
  } catch (e) {
    const list = document.getElementById("candidaturas-list");
    if (list) {
      list.innerHTML = `<p class="form-msg err">${TrabalhadorAuth.escapeHtml(e.message || "Erro ao carregar.")}</p>`;
    }
  }
});

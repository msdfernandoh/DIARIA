/**
 * Navegação global das páginas web (trabalhador / empregador / visitante).
 */
function escapeHtmlNav(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function initWebNav() {
  const el = document.getElementById("web-nav-auth");
  if (!el) return;

  let user = null;
  let profile = null;
  let tipo = null;

  if (window.TrabalhadorAuth) {
    user = await TrabalhadorAuth.getSessionUser();
    if (user) {
      profile = await TrabalhadorAuth.fetchWorkerProfile(user.id);
      tipo = profile?.tipo || "empregado";
    }
  }

  if (!user && window.EmpregadorAuth) {
    user = await EmpregadorAuth.getSessionUser();
    if (user) {
      profile = await EmpregadorAuth.fetchEmployerProfile(user.id);
      tipo = "empregador";
    }
  }

  if (user && tipo === "empregado") {
    const nome = profile?.nome?.split(" ")[0] || "Olá";
    el.innerHTML = `
      <a href="/vagas-disponiveis.html" class="nav-link">Ver vagas</a>
      <a href="/minhas-candidaturas.html" class="nav-link">Minhas candidaturas</a>
      <span class="nav-link-muted">${escapeHtmlNav(nome)}</span>
      <button type="button" class="nav-btn" id="btn-nav-sair">Sair</button>
    `;
    document.getElementById("btn-nav-sair")?.addEventListener("click", async () => {
      await TrabalhadorAuth.signOutWorker();
      window.location.href = "/trabalhe.html";
    });
    return;
  }

  if (user && tipo === "empregador") {
    const nome = profile?.nome?.split(" ")[0] || "Conta";
    el.innerHTML = `
      <a href="/minhas-vagas.html" class="nav-link">Minhas vagas · ${escapeHtmlNav(nome)}</a>
      <button type="button" class="nav-btn" id="btn-nav-sair">Sair</button>
    `;
    document.getElementById("btn-nav-sair")?.addEventListener("click", async () => {
      await EmpregadorAuth.signOutEmployer();
      window.location.href = "/contrate.html";
    });
    return;
  }

  el.innerHTML = `
    <a href="/trabalhe.html" class="nav-link">Trabalhe</a>
    <a href="/contrate.html" class="nav-link">Contrate</a>
    <a href="/parceiro.html" class="nav-link">Parceiro</a>
    <a href="/login-trabalhador.html" class="nav-link">Entrar</a>
  `;
}

window.WebNav = { initWebNav };

document.addEventListener("DOMContentLoaded", async () => {
  if (window.WebNav) WebNav.initWebNav();

  const params = new URLSearchParams(window.location.search);
  const next = params.get("next") || "";

  const flash = TrabalhadorAuth.consumeAuthFlashMessage?.();
  const msg = document.getElementById("form-msg");
  if (flash && msg) {
    msg.textContent = flash;
    msg.className = "form-msg warn";
  }

  void TrabalhadorAuth.getSessionUser().then(async (user) => {
    if (user) {
      const landing = next && next.startsWith("/")
        ? next
        : await TrabalhadorAuth.resolveWorkerLanding(user);
      window.location.href = landing;
    }
  });

  const form = document.getElementById("login-form");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "";
    msg.className = "form-msg";
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    const fd = new FormData(form);
    try {
      await TrabalhadorAuth.signInWorker(fd.get("email"), fd.get("password"));
      const user = await TrabalhadorAuth.getSessionUser();
      if (next && next.startsWith("/")) {
        window.location.href = next;
        return;
      }
      window.location.href = user
        ? await TrabalhadorAuth.resolveWorkerLanding(user)
        : "/vagas-disponiveis.html";
    } catch (err) {
      msg.textContent = err.message || "Não foi possível entrar.";
      msg.className = "form-msg err";
      btn.disabled = false;
    }
  });

  document.getElementById("btn-reset")?.addEventListener("click", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email")?.value?.trim();
    if (!email) {
      msg.textContent = "Informe seu e-mail para recuperar a senha.";
      msg.className = "form-msg err";
      return;
    }
    const sb = TrabalhadorAuth.getSupabase();
    const redirectTo = `${window.location.origin}/login-trabalhador.html`;
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      msg.textContent = error.message;
      msg.className = "form-msg err";
      return;
    }
    msg.textContent = "Enviamos um link de redefinição para seu e-mail.";
    msg.className = "form-msg ok";
  });
});

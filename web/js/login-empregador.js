document.addEventListener("DOMContentLoaded", () => {
  EmpregadorAuth.initWebHeader();

  void EmpregadorAuth.getSessionUser().then((user) => {
    if (user) window.location.href = "/minhas-vagas.html";
  });

  const form = document.getElementById("login-form");
  const msg = document.getElementById("form-msg");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "";
    msg.className = "form-msg";
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    const fd = new FormData(form);
    try {
      await EmpregadorAuth.signInEmployer(fd.get("email"), fd.get("password"));
      window.location.href = "/minhas-vagas.html";
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
    const sb = EmpregadorAuth.getSupabase();
    const redirectTo = `${window.location.origin}/login-empregador.html`;
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

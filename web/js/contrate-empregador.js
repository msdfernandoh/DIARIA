function formProfileFromFormData(fd) {
  return {
    nome: fd.get("nome"),
    celular: fd.get("celular"),
    email: fd.get("email"),
    cidade: fd.get("cidade"),
    estado: fd.get("estado"),
    tipoContratante: fd.get("tipo_contratante") || "pf",
  };
}

function initContrateEmpregador() {
  const form = document.getElementById("lead-form");
  if (!form) return;

  const celInput = form.querySelector('[name="celular"]');
  if (celInput) {
    celInput.addEventListener("input", () => {
      celInput.value = EmpregadorAuth.maskPhone(celInput.value);
    });
  }

  const tipoHidden = form.querySelector('[name="tipo_contratante"]');
  const tipoBtns = form.querySelectorAll("[data-tipo]");
  tipoBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      tipoBtns.forEach((b) => {
        b.classList.remove("active");
        b.style.borderColor = "rgba(255,255,255,.35)";
        b.style.background = "rgba(255,255,255,.1)";
      });
      btn.classList.add("active");
      btn.style.borderColor = "#fff";
      btn.style.background = "rgba(255,255,255,.28)";
      if (tipoHidden) tipoHidden.value = btn.dataset.tipo || "pf";
    });
  });
  if (tipoBtns[0]) tipoBtns[0].classList.add("active");

  const existingPanel = document.getElementById("existing-account-panel");
  const loginBlock = document.getElementById("existing-login-fields");
  let pendingEmail = "";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = form.querySelector(".lead-form-msg");
    const submitBtn = document.getElementById("btn-cadastrar") || form.querySelector('button[type="submit"]');
    const loginBtn = document.getElementById("btn-existing-login");

    if (loginBlock && !loginBlock.classList.contains("panel-hidden")) {
      return;
    }

    msg.textContent = "";
    msg.className = "lead-form-msg";
    submitBtn.disabled = true;

    try {
      const fd = new FormData(form);
      if (fd.get("website")) {
        submitBtn.disabled = false;
        return;
      }

      const result = await EmpregadorAuth.signUpEmployer({
        nome: fd.get("nome"),
        celular: fd.get("celular"),
        email: fd.get("email"),
        cidade: fd.get("cidade"),
        estado: fd.get("estado"),
        tipoContratante: fd.get("tipo_contratante") || "pf",
      });

      if (result.existing) {
        pendingEmail = result.email;
        if (existingPanel) existingPanel.classList.remove("panel-hidden");
        if (loginBlock) loginBlock.classList.remove("panel-hidden");
        const emailField = form.querySelector('[name="email"]');
        if (emailField) emailField.readOnly = true;
        if (submitBtn) {
          submitBtn.style.display = "none";
          submitBtn.disabled = true;
        }
        msg.textContent = "";
        msg.className = "lead-form-msg";
        submitBtn.disabled = false;
        return;
      }

      if (result.needsEmailConfirm) {
        msg.textContent =
          "Conta criada! Confirme o e-mail que enviamos. Depois entre em «Entrar na minha conta» com a senha: WhatsApp só números + @diaria.";
        msg.classList.add("ok");
        if (existingPanel) existingPanel.classList.remove("panel-hidden");
        if (loginBlock) loginBlock.classList.remove("panel-hidden");
        pendingEmail = result.email || fd.get("email");
        if (submitBtn) submitBtn.style.display = "none";
        submitBtn.disabled = false;
        return;
      }

      msg.textContent = "Conta criada! Redirecionando…";
      msg.classList.add("ok");
      window.location.href = result.redirect || "/publicar-vaga.html";
    } catch (err) {
      msg.textContent = err.message || "Não foi possível cadastrar. Tente novamente.";
      msg.classList.add("err");
      submitBtn.disabled = false;
    }
  });

  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const msg = form.querySelector(".lead-form-msg");
      msg.textContent = "";
      msg.className = "lead-form-msg";
      loginBtn.disabled = true;
      try {
        const fd = new FormData(form);
        const pwd =
          document.getElementById("existing-password")?.value ||
          EmpregadorAuth.defaultPasswordFromCelular(fd.get("celular"));
        await EmpregadorAuth.signInEmployer(
          pendingEmail || form.querySelector('[name="email"]')?.value,
          pwd,
          formProfileFromFormData(fd)
        );
        window.location.href = "/publicar-vaga.html";
      } catch (err) {
        msg.textContent = err.message || "E-mail ou senha incorretos.";
        msg.classList.add("err");
        loginBtn.disabled = false;
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  EmpregadorAuth.initWebHeader();
  initContrateEmpregador();
});

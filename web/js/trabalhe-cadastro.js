const REDIRECT_AFTER_SIGNUP = "/completar-perfil-trabalhador.html";
const LOGIN_URL = "/login-trabalhador.html";

const REDIRECT_OUTCOME_TYPES = new Set([
  "created",
  "resume_onboarding",
  "auth_without_profile",
  "already_complete",
]);

const LOGIN_PANEL_TYPES = new Set(["wrong_password_existing_email"]);

function setMsgClass(msg, variant) {
  const hero = msg.classList.contains("hero-form-msg");
  const base = hero ? "form-msg hero-form-msg" : "form-msg";
  if (variant === "ok") return `${base} ok`;
  if (variant === "warn") return `${base} warn`;
  if (variant === "err") return `${base} err`;
  return base;
}

function wireCepField(form, cepInput, cidadeInput, estadoInput, hintEl) {
  if (!cepInput) return;
  cepInput.addEventListener("input", () => {
    cepInput.value = TrabalhadorAuth.maskCep(cepInput.value);
  });
  cepInput.addEventListener("blur", async () => {
    const r = await TrabalhadorAuth.buscarCep(cepInput.value);
    if (!r) {
      if (hintEl) {
        hintEl.textContent = "CEP não encontrado. Confira os números.";
        hintEl.className = hintEl.className.replace(/\s*ok/g, "") + " err";
      }
      return;
    }
    if (cidadeInput) cidadeInput.value = r.cidade;
    if (estadoInput) estadoInput.value = r.estado;
    if (hintEl) {
      hintEl.textContent = `${r.cidade} — ${r.estado}`;
      hintEl.className = (hintEl.className.split(" ").filter((c) => c !== "err").join(" ") + " ok").trim();
    }
  });
}

function wireCodigoField(form, codigoInput, codigoMsg, codigoStateRef) {
  if (!codigoInput) return;
  let codigoTimer = null;
  codigoInput.addEventListener("input", () => {
    codigoInput.value = codigoInput.value.toUpperCase().replace(/\s/g, "");
    const code = codigoInput.value.trim();
    clearTimeout(codigoTimer);
    if (code.length < 4) {
      codigoStateRef.current = { codigoValido: false, codigoEmpreendedorId: null };
      if (codigoMsg) {
        codigoMsg.textContent = "";
        codigoMsg.className = "codigo-msg";
      }
      return;
    }
    codigoTimer = setTimeout(async () => {
      try {
        const row = await TrabalhadorAuth.validateEntrepreneurCode(code);
        if (row) {
          codigoStateRef.current = {
            codigoValido: true,
            codigoEmpreendedorId: row.user_id,
          };
          if (codigoMsg) {
            codigoMsg.textContent =
              "✅ Código confirmado! +100 moedas de bônus (liberadas em 7 dias).";
            codigoMsg.className = "codigo-msg ok";
          }
        } else {
          codigoStateRef.current = { codigoValido: false, codigoEmpreendedorId: null };
          if (codigoMsg) {
            codigoMsg.textContent = "Código não encontrado — pode continuar sem ele.";
            codigoMsg.className = "codigo-msg warn";
          }
        }
      } catch {
        if (codigoMsg) {
          codigoMsg.textContent = "Erro ao validar código. Tente de novo.";
          codigoMsg.className = "codigo-msg warn";
        }
      }
    }, 600);
  });
}

async function resolveCodigoState(fd, codigoStateRef) {
  const codigoRaw = String(fd.get("codigo") || "").trim();
  if (codigoRaw.length < 4) {
    codigoStateRef.current = { codigoValido: false, codigoEmpreendedorId: null };
    return codigoStateRef.current;
  }
  try {
    const row = await TrabalhadorAuth.validateEntrepreneurCode(codigoRaw);
    codigoStateRef.current = row
      ? { codigoValido: true, codigoEmpreendedorId: row.user_id }
      : { codigoValido: false, codigoEmpreendedorId: null };
  } catch {
    codigoStateRef.current = { codigoValido: false, codigoEmpreendedorId: null };
  }
  return codigoStateRef.current;
}

function applySignupOutcome(outcome, ui, helpers) {
  const { msg, submitBtn, existingPanel, loginBlock, emailField } = ui;
  const { pendingEmailRef, showLoginPanel } = helpers;

  if (!outcome?.type) {
    return { handled: false };
  }

  pendingEmailRef.current = outcome.email || pendingEmailRef.current;

  if (REDIRECT_OUTCOME_TYPES.has(outcome.type)) {
    msg.textContent = outcome.message || "Redirecionando…";
    msg.className = setMsgClass(msg, "ok");
    const target = outcome.redirectTo || REDIRECT_AFTER_SIGNUP;
    window.location.href = target;
    return { handled: true };
  }

  if (outcome.type === "email_not_confirmed") {
    msg.textContent =
      outcome.message ||
      "Seu cadastro foi iniciado, mas o e-mail ainda precisa ser confirmado. Verifique sua caixa de entrada.";
    msg.className = setMsgClass(msg, "warn");
    if (submitBtn) submitBtn.disabled = false;
    return { handled: true };
  }

  if (outcome.type === "profile_type_conflict") {
    msg.textContent = outcome.message || "Este e-mail já está em uso em outro perfil.";
    msg.className = setMsgClass(msg, "err");
    if (submitBtn) submitBtn.disabled = false;
    return { handled: true };
  }

  if (outcome.type === "error") {
    msg.textContent = outcome.message || "Não foi possível concluir o cadastro agora. Tente novamente.";
    msg.className = setMsgClass(msg, "err");
    if (submitBtn) submitBtn.disabled = false;
    return { handled: true };
  }

  if (LOGIN_PANEL_TYPES.has(outcome.type)) {
    showLoginPanel();
    if (emailField) emailField.readOnly = true;
    if (submitBtn) submitBtn.style.display = "none";
    msg.textContent = outcome.message || "Este e-mail já possui cadastro.";
    msg.className = setMsgClass(msg, outcome.type === "already_complete" ? "warn" : "warn");
    if (submitBtn) submitBtn.disabled = false;
    return { handled: true };
  }

  return { handled: false };
}

async function runWorkerSignup(form, fd, codigoStateRef, ui, helpers) {
  const { msg } = ui;
  const cidade = String(fd.get("cidade") || "").trim();
  const estado = String(fd.get("estado") || "").trim();
  if (!cidade || !estado) {
    throw new Error("Informe um CEP válido para preencher cidade e UF.");
  }

  await resolveCodigoState(fd, codigoStateRef);
  const st = codigoStateRef.current;

  const result = await TrabalhadorAuth.signUpWorker({
    nome: fd.get("nome"),
    celular: fd.get("celular"),
    email: fd.get("email"),
    cep: fd.get("cep"),
    cidade,
    estado,
    password: fd.get("password"),
    codigo: fd.get("codigo"),
    codigoValido: st.codigoValido,
    codigoEmpreendedorId: st.codigoEmpreendedorId,
  });

  return applySignupOutcome(result, ui, helpers);
}

function bindSignupForm(form, options) {
  const {
    requireCheckboxes = false,
    withCodigo = false,
    submitBtnId,
    existingPanelId,
    existingLoginBtnId,
    existingPasswordId,
    loginBlockId,
  } = options;

  const codigoStateRef = {
    current: { codigoValido: false, codigoEmpreendedorId: null },
  };

  const celInput = form.querySelector('[name="celular"]');
  if (celInput) {
    celInput.addEventListener("input", () => {
      celInput.value = TrabalhadorAuth.maskPhone(celInput.value);
    });
  }

  const cepInput = form.querySelector('[name="cep"]');
  const cidadeInput = form.querySelector('[name="cidade"]');
  const estadoInput = form.querySelector('[name="estado"]');
  const hintEl = options.cepHintId ? document.getElementById(options.cepHintId) : null;
  wireCepField(form, cepInput, cidadeInput, estadoInput, hintEl);

  if (withCodigo) {
    wireCodigoField(
      form,
      form.querySelector('[name="codigo"]'),
      document.getElementById("codigo-msg"),
      codigoStateRef
    );
  }

  const existingPanel = existingPanelId ? document.getElementById(existingPanelId) : null;
  const loginBlock = loginBlockId ? document.getElementById(loginBlockId) : null;
  const loginBtn = existingLoginBtnId ? document.getElementById(existingLoginBtnId) : null;
  const pwdInput = existingPasswordId ? document.getElementById(existingPasswordId) : null;
  const pendingEmailRef = { current: "" };
  let submitting = false;

  function showLoginPanel() {
    if (existingPanel) existingPanel.classList.remove("panel-hidden");
    if (loginBlock) loginBlock.classList.remove("panel-hidden");
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (submitting) return;

    const msg = form.querySelector(".form-msg");
    const submitBtn = submitBtnId ? document.getElementById(submitBtnId) : form.querySelector('button[type="submit"]');
    const emailField = form.querySelector('[name="email"]');

    if (loginBlock && !loginBlock.classList.contains("panel-hidden")) {
      return;
    }
    if (existingPanel && !existingPanel.classList.contains("panel-hidden") && loginBtn && pwdInput) {
      return;
    }

    if (requireCheckboxes) {
      if (!form.querySelector('[name="termos"]')?.checked) {
        msg.textContent = "Aceite os Termos de Uso para continuar.";
        msg.className = setMsgClass(msg, "err");
        return;
      }
      if (!form.querySelector('[name="pagamentos"]')?.checked) {
        msg.textContent = "Confirme que entende como funcionam os pagamentos.";
        msg.className = setMsgClass(msg, "err");
        return;
      }
    }

    msg.textContent = "";
    msg.className = setMsgClass(msg, null);
    if (submitBtn) submitBtn.disabled = true;
    submitting = true;

    try {
      const fd = new FormData(form);
      if (fd.get("website")) {
        if (submitBtn) submitBtn.disabled = false;
        submitting = false;
        return;
      }

      const helpers = { pendingEmailRef, showLoginPanel };
      const ui = { msg, submitBtn, existingPanel, loginBlock, emailField };
      await runWorkerSignup(form, fd, codigoStateRef, ui, helpers);
    } catch (err) {
      msg.textContent = err.message || "Não foi possível cadastrar. Tente novamente.";
      msg.className = setMsgClass(msg, "err");
      if (submitBtn) submitBtn.disabled = false;
    } finally {
      submitting = false;
    }
  });

  if (loginBtn) {
    loginBtn.addEventListener("click", async () => {
      const msg = form.querySelector(".form-msg");
      msg.textContent = "";
      msg.className = setMsgClass(msg, null);
      loginBtn.disabled = true;
      try {
        const email = pendingEmailRef.current || form.querySelector('[name="email"]')?.value;
        const pwd = pwdInput?.value;
        if (!pwd) throw new Error("Informe sua senha.");
        await TrabalhadorAuth.signInWorker(email, pwd);
        const logged = await TrabalhadorAuth.getSessionUser();
        window.location.href = logged
          ? await TrabalhadorAuth.resolveWorkerLanding(logged)
          : LOGIN_URL;
      } catch (err) {
        msg.textContent = err.message || "E-mail ou senha incorretos.";
        msg.className = setMsgClass(msg, "err");
        loginBtn.disabled = false;
      }
    });
  }
}

function initTrabalheCadastro() {
  const rapido = document.getElementById("signup-trabalhador-rapido-form");
  if (rapido) {
    bindSignupForm(rapido, {
      requireCheckboxes: false,
      withCodigo: false,
      submitBtnId: "btn-cadastrar-rapido",
      existingPanelId: "existing-account-panel-rapido",
      existingLoginBtnId: "btn-existing-login-rapido",
      existingPasswordId: "existing-password-rapido",
      cepHintId: "rapido-cep-hint",
    });
  }

  const completo = document.getElementById("signup-trabalhador-form");
  if (completo) {
    bindSignupForm(completo, {
      requireCheckboxes: true,
      withCodigo: true,
      submitBtnId: "btn-cadastrar-trabalhador",
      existingPanelId: "existing-account-panel",
      existingLoginBtnId: "btn-existing-login-trabalhador",
      existingPasswordId: "existing-password-trabalhador",
      loginBlockId: "existing-login-fields",
    });
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  if (window.WebNav) WebNav.initWebNav();

  const flash = TrabalhadorAuth.consumeAuthFlashMessage?.();
  if (flash) {
    const anchor = document.querySelector("#signup-trabalhador-rapido-form .form-msg") ||
      document.querySelector("#signup-trabalhador-form .form-msg");
    if (anchor) {
      anchor.textContent = flash;
      anchor.className = anchor.classList.contains("hero-form-msg")
        ? "form-msg hero-form-msg warn"
        : "form-msg warn";
    }
  }

  const redirected = await TrabalhadorAuth.redirectLoggedInWorkerFromSignupPage?.();
  if (redirected) return;

  initTrabalheCadastro();
});

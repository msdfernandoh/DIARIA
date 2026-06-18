const WEEKDAYS = [
  { id: 0, label: "Dom" },
  { id: 1, label: "Seg" },
  { id: 2, label: "Ter" },
  { id: 3, label: "Qua" },
  { id: 4, label: "Qui" },
  { id: 5, label: "Sex" },
  { id: 6, label: "Sáb" },
];

document.addEventListener("DOMContentLoaded", async () => {
  if (window.WebNav) WebNav.initWebNav();

  const user = await TrabalhadorAuth.requireWorkerAuth("/login-trabalhador.html", {
    sessionExpiredMessage:
      "Sua sessão expirou. Entre novamente para continuar seu cadastro.",
    loginRedirect: "/login-trabalhador.html?next=/completar-perfil-trabalhador.html",
  });
  if (!user) return;

  try {
    await TrabalhadorAuth.ensureWorkerProfileFromAuth(user);
  } catch (err) {
    const main = document.querySelector("main.page");
    if (main) {
      const p = document.createElement("p");
      p.className = "form-msg err";
      p.textContent = err.message || "Não foi possível carregar seu perfil.";
      main.prepend(p);
    }
    return;
  }

  const profile = await TrabalhadorAuth.fetchWorkerProfile(user.id);
  if (profile?.onboarding_completo === true) {
    window.location.href = "/vagas-disponiveis.html";
    return;
  }

  const selected = new Set();
  let diasSemana = [1, 2, 3, 4, 5];
  let skipAvailability = false;
  let qualquerDia = false;

  const grid = document.getElementById("skills-grid");
  const countEl = document.getElementById("skills-count");
  const weekEl = document.getElementById("weekdays");
  const qualquerEl = document.getElementById("qualquer-dia");
  const weekWrap = document.getElementById("weekdays-wrap");

  (window.JOB_CATEGORIES || []).forEach((cat) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "skill-chip";
    btn.textContent = `${cat.emoji} ${cat.label}`;
    btn.dataset.id = cat.id;
    btn.addEventListener("click", () => {
      if (selected.has(cat.id)) {
        selected.delete(cat.id);
        btn.classList.remove("on");
      } else if (selected.size < 6) {
        selected.add(cat.id);
        btn.classList.add("on");
      }
      countEl.textContent = `${selected.size}/6 selecionadas`;
      countEl.className = "form-msg";
    });
    grid.appendChild(btn);
  });

  WEEKDAYS.forEach((d) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "day-chip" + (diasSemana.includes(d.id) ? " on" : "");
    btn.textContent = d.label;
    btn.dataset.id = String(d.id);
    btn.addEventListener("click", () => {
      if (qualquerDia) return;
      skipAvailability = false;
      const id = d.id;
      if (diasSemana.includes(id)) {
        diasSemana = diasSemana.filter((x) => x !== id);
        btn.classList.remove("on");
      } else {
        diasSemana.push(id);
        btn.classList.add("on");
      }
    });
    weekEl.appendChild(btn);
  });

  qualquerEl?.addEventListener("change", () => {
    qualquerDia = qualquerEl.checked;
    skipAvailability = false;
    if (qualquerDia) {
      weekWrap.style.opacity = "0.45";
      weekEl.querySelectorAll(".day-chip").forEach((b) => b.classList.add("on"));
    } else {
      weekWrap.style.opacity = "1";
      diasSemana = [1, 2, 3, 4, 5];
      weekEl.querySelectorAll(".day-chip").forEach((b) => {
        const id = Number(b.dataset.id);
        b.classList.toggle("on", diasSemana.includes(id));
      });
    }
  });

  document.getElementById("btn-skip-avail")?.addEventListener("click", () => {
    skipAvailability = true;
    qualquerDia = false;
    if (qualquerEl) qualquerEl.checked = false;
    weekWrap.style.opacity = "0.45";
    diasSemana = [];
    weekEl.querySelectorAll(".day-chip").forEach((b) => b.classList.remove("on"));
  });

  const form = document.getElementById("completar-perfil-form");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const msg = form.querySelector(".form-msg");
    const btn = document.getElementById("btn-salvar-perfil");
    msg.textContent = "";
    msg.className = "form-msg";
    if (selected.size === 0) {
      msg.textContent = "Escolha pelo menos uma habilidade.";
      msg.className = "form-msg err";
      return;
    }
    btn.disabled = true;
    try {
      await TrabalhadorAuth.completeWorkerWebOnboarding(user.id, {
        skills: [...selected],
        diasSemana,
        disponivelQualquerDia: qualquerDia,
        skipAvailability,
      });
      window.location.href = "/vagas-disponiveis.html";
    } catch (err) {
      msg.textContent = err.message || "Erro ao salvar perfil.";
      msg.className = "form-msg err";
      btn.disabled = false;
    }
  });
});

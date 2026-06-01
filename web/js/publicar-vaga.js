function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function fillCategories() {
  const sel = document.getElementById("categoria");
  if (!sel || !window.JOB_CATEGORIES) return;
  sel.innerHTML = '<option value="">Selecione…</option>';
  JOB_CATEGORIES.forEach((c) => {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = `${c.emoji} ${c.label}`;
    sel.appendChild(opt);
  });
}

function toggleCepBlock() {
  const formato = document.querySelector('input[name="formato"]:checked')?.value || "presencial";
  const block = document.getElementById("cep-block");
  if (block) block.style.display = formato === "remoto" ? "none" : "block";
}

async function fetchCep(cep) {
  const d = String(cep).replace(/\D/g, "");
  if (d.length !== 8) return;
  const res = await fetch(`https://viacep.com.br/ws/${d}/json/`);
  const data = await res.json();
  if (data.erro) throw new Error("CEP não encontrado.");
  const cidade = document.getElementById("cidade_local");
  const estado = document.getElementById("estado_local");
  const endereco = document.getElementById("endereco_local");
  if (cidade) cidade.value = data.localidade || "";
  if (estado) estado.value = data.uf || "";
  if (endereco) {
    endereco.value = [data.logradouro, data.bairro].filter(Boolean).join(", ");
  }
}

function resolveContrato(tipo) {
  if (tipo === "emprego_fixo") return "clt";
  if (tipo === "remoto") return "pj";
  return "diaria";
}

async function publishJobFromForm(userId, profile) {
  const titulo = document.getElementById("titulo").value.trim();
  const categoria = document.getElementById("categoria").value;
  const tipo = document.querySelector('input[name="tipo"]:checked')?.value;
  const dataInicio = document.getElementById("data_inicio").value;
  const horarioInicio = document.getElementById("horario_inicio").value || null;
  const horarioFim = document.getElementById("horario_fim").value || null;
  const valor = parseFloat(document.getElementById("valor").value);
  const vagasTotal = parseInt(document.getElementById("vagas_total").value, 10) || 1;
  const formato = document.querySelector('input[name="formato"]:checked')?.value || "presencial";
  const cep = document.getElementById("cep")?.value || null;
  const cidadeLocal = document.getElementById("cidade_local")?.value || profile?.cidade;
  const estadoLocal = document.getElementById("estado_local")?.value || null;
  const endereco = document.getElementById("endereco_local")?.value || null;
  const descricao = document.getElementById("descricao").value.trim().slice(0, 500);
  const urgente = document.getElementById("urgente").checked;

  if (!titulo) throw new Error("Informe o título da vaga.");
  if (!categoria) throw new Error("Selecione a categoria.");
  if (!tipo) throw new Error("Selecione o tipo da vaga.");
  if (!dataInicio) throw new Error("Informe a data.");
  if (Number.isNaN(valor) || valor <= 0) throw new Error("Informe o valor em R$.");

  const payload = {
    empregador_id: userId,
    titulo: titulo.slice(0, 80),
    descricao: descricao || titulo,
    requisitos: null,
    categoria,
    tipo,
    formato,
    contrato: resolveContrato(tipo),
    data_inicio: dataInicio,
    data_fim: null,
    horario_inicio: tipo === "diaria" ? horarioInicio : null,
    horario_fim: tipo === "diaria" ? horarioFim : null,
    recorrente: false,
    dias_recorrencia: null,
    recorrencia_ate: null,
    valor,
    vagas_total: vagasTotal,
    vagas_restantes: vagasTotal,
    cep: cep ? cep.replace(/\D/g, "") : null,
    cidade: formato === "remoto" ? null : cidadeLocal,
    estado: estadoLocal,
    endereco: formato === "remoto" ? null : endereco,
    lat: null,
    lng: null,
    urgente,
    beneficios: null,
    destaque_nivel: "organico",
    destaque_grupo_id: null,
    ativa: true,
    pausada: false,
  };

  const sb = EmpregadorAuth.getSupabase();
  const { error } = await sb.from("jobs").insert(payload);
  if (error) throw error;
}

document.addEventListener("DOMContentLoaded", async () => {
  EmpregadorAuth.initWebHeader();
  fillCategories();

  const dataInput = document.getElementById("data_inicio");
  if (dataInput) dataInput.min = todayIso();

  document.querySelectorAll('input[name="formato"]').forEach((el) => {
    el.addEventListener("change", toggleCepBlock);
  });
  toggleCepBlock();

  const cepInput = document.getElementById("cep");
  if (cepInput) {
    cepInput.addEventListener("blur", () => {
      void fetchCep(cepInput.value).catch(() => {});
    });
  }

  const desc = document.getElementById("descricao");
  const descCount = document.getElementById("desc-count");
  if (desc && descCount) {
    desc.addEventListener("input", () => {
      descCount.textContent = String(desc.value.length);
    });
  }

  const user = await EmpregadorAuth.requireAuth("/contrate.html");
  if (!user) return;

  const profile = await EmpregadorAuth.fetchEmployerProfile(user.id);
  const cidadeLocal = document.getElementById("cidade_local");
  if (cidadeLocal && profile?.cidade && !cidadeLocal.value) {
    cidadeLocal.value = profile.cidade;
  }

  const form = document.getElementById("job-form");
  const msg = document.getElementById("form-msg");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    msg.textContent = "";
    msg.className = "form-msg";
    const btn = document.getElementById("btn-publicar");
    btn.disabled = true;
    try {
      await publishJobFromForm(user.id, profile);
      window.location.href = "/minhas-vagas.html";
    } catch (err) {
      msg.textContent = err.message || "Erro ao publicar.";
      msg.className = "form-msg err";
      btn.disabled = false;
    }
  });
});

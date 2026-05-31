/**
 * Envia lead para Supabase (REST /web_leads — RLS anon).
 * Não depende da Edge Function (evita "Failed to fetch" se a function não foi deployada).
 */
function getUtmParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    utm_source: p.get("utm_source"),
    utm_medium: p.get("utm_medium"),
    utm_campaign: p.get("utm_campaign"),
  };
}

function maskPhone(value) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

async function submitLead(payload) {
  const cfg = window.DIARIA_CONFIG || {};
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
    throw new Error(
      "Conexão com o servidor ainda não configurada. Aguarde o redeploy na Vercel ou contato o suporte."
    );
  }

  if (payload.website) {
    return { ok: true };
  }

  const nome = (payload.nome || "").trim();
  const celular = String(payload.celular || "").replace(/\D/g, "");
  const cidade = (payload.cidade || "").trim();
  const estado = (payload.estado || "").trim().slice(0, 2).toUpperCase() || null;

  if (nome.length < 2) throw new Error("Informe seu nome.");
  if (celular.length < 10) throw new Error("Informe um WhatsApp válido.");
  if (cidade.length < 2) throw new Error("Informe sua cidade.");

  const row = {
    nome,
    celular,
    cidade,
    estado,
    email: (payload.email || "").trim() || null,
    tipo_interesse: payload.tipo_interesse,
    origem_pagina: payload.origem_pagina,
    utm_source: payload.utm_source || null,
    utm_medium: payload.utm_medium || null,
    utm_campaign: payload.utm_campaign || null,
  };

  const base = cfg.supabaseUrl.replace(/\/$/, "");
  let res;
  try {
    res = await fetch(`${base}/rest/v1/web_leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: cfg.supabaseAnonKey,
        Authorization: `Bearer ${cfg.supabaseAnonKey}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify(row),
    });
  } catch {
    throw new Error(
      "Falha de rede ao enviar. Verifique sua internet ou tente outro navegador."
    );
  }

  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      /* ignore */
    }
    if (res.status === 401 || res.status === 403) {
      throw new Error("Permissão negada no banco. Confira RLS da tabela web_leads.");
    }
    console.error("web_leads insert failed", res.status, detail);
    throw new Error("Não foi possível salvar. Tente de novo em instantes.");
  }

  return { ok: true };
}

function initLeadForm({ formId, tipoInteresse, origemPagina }) {
  const form = document.getElementById(formId);
  if (!form) return;

  const phoneInput = form.querySelector('[name="celular"]');
  if (phoneInput) {
    phoneInput.addEventListener("input", (e) => {
      e.target.value = maskPhone(e.target.value);
    });
  }

  const msg = form.querySelector(".lead-form-msg");
  const btn = form.querySelector('button[type="submit"]');
  const defaultBtnText = btn ? btn.textContent : "";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (msg) {
      msg.textContent = "";
      msg.className = "lead-form-msg";
    }
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Enviando…";
    }

    const fd = new FormData(form);
    const utm = getUtmParams();
    const payload = {
      nome: String(fd.get("nome") || "").trim(),
      celular: String(fd.get("celular") || ""),
      cidade: String(fd.get("cidade") || "").trim(),
      estado: String(fd.get("estado") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      tipo_interesse: tipoInteresse,
      origem_pagina: origemPagina,
      website: String(fd.get("website") || ""),
      ...utm,
    };

    try {
      await submitLead(payload);
      form.reset();
      if (msg) {
        msg.textContent =
          "Recebemos seu cadastro! Em breve você receberá novidades no WhatsApp.";
        msg.classList.add("ok");
      }
    } catch (err) {
      if (msg) {
        msg.textContent = err.message || "Erro ao enviar.";
        msg.classList.add("err");
      }
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = defaultBtnText;
      }
    }
  });
}

window.initLeadForm = initLeadForm;

/**
 * Envia lead para Supabase Edge Function submit-web-lead.
 * Uso: initLeadForm({ formId, tipoInteresse, origemPagina })
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
    throw new Error("Configure Supabase em web/js/config.js");
  }
  const url = `${cfg.supabaseUrl.replace(/\/$/, "")}/functions/v1/submit-web-lead`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.supabaseAnonKey}`,
      apikey: cfg.supabaseAnonKey,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "Não foi possível enviar. Tente de novo.");
  }
  return data;
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

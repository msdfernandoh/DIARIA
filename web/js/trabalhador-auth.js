/**
 * Auth + sessão Supabase para fluxo web do trabalhador (empregado).
 * Depende de: config.js, @supabase/supabase-js (CDN)
 */
const SESSION_KEY = "diaria_trabalhador_session";

function digitsOnly(s) {
  return String(s || "").replace(/\D/g, "");
}

function maskPhone(value) {
  const d = digitsOnly(value).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function maskCep(value) {
  const d = digitsOnly(value).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function getConfig() {
  const cfg = window.DIARIA_CONFIG || {};
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
    throw new Error("Supabase não configurado. Verifique o deploy na Vercel.");
  }
  return cfg;
}

let supabaseClient = null;

function getSupabase() {
  if (supabaseClient) return supabaseClient;
  const cfg = getConfig();
  if (!window.supabase?.createClient) {
    throw new Error("Biblioteca Supabase não carregou. Recarregue a página.");
  }
  supabaseClient = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  supabaseClient.auth.onAuthStateChange((_event, session) => {
    if (session) saveSession(session);
  });
  return supabaseClient;
}

function saveSession(session) {
  if (!session) {
    localStorage.removeItem(SESSION_KEY);
    return;
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

function loadSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function restoreSupabaseSession() {
  const session = loadSession();
  if (!session?.access_token) return null;
  const sb = getSupabase();
  const { error } = await sb.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  if (error) {
    saveSession(null);
    return null;
  }
  return session;
}

async function ensureSessionOnClient(session) {
  if (!session?.access_token) return false;
  saveSession(session);
  const sb = getSupabase();
  const { error } = await sb.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });
  if (error) throw error;
  return true;
}

async function getSessionUser() {
  await restoreSupabaseSession();
  const sb = getSupabase();
  const { data } = await sb.auth.getUser();
  return data.user ?? null;
}

async function signOutWorker() {
  const sb = getSupabase();
  await sb.auth.signOut();
  saveSession(null);
}

function isAlreadyRegisteredError(err) {
  const msg = (err?.message || "").toLowerCase();
  return (
    msg.includes("already registered") ||
    msg.includes("already been registered") ||
    msg.includes("user already") ||
    err?.status === 422
  );
}

async function validateEntrepreneurCode(code) {
  const normalized = String(code || "").trim();
  if (normalized.length < 4) return null;
  const sb = getSupabase();
  const { data, error } = await sb.rpc("validate_entrepreneur_code_public", {
    p_codigo: normalized,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.user_id) return null;
  return row;
}

async function upsertWorkerProfile(userId, profile) {
  const sb = getSupabase();
  const row = {
    id: userId,
    nome: profile.nome.trim(),
    celular: digitsOnly(profile.celular),
    email: profile.email ? profile.email.trim().toLowerCase() : null,
    cep: profile.cep ? digitsOnly(profile.cep) : null,
    cidade: profile.cidade?.trim() || null,
    estado: profile.estado ? profile.estado.trim().slice(0, 2).toUpperCase() : null,
    tipo: "empregado",
    termo_aceito_em: new Date().toISOString(),
    onboarding_completo: false,
  };
  const { error } = await sb.from("users").upsert(row, { onConflict: "id" });
  if (error) throw error;
}

async function linkEntrepreneurGroup(userId, empreendedorId, codigo) {
  const sb = getSupabase();
  const { error } = await sb.from("user_group").upsert(
    {
      user_id: userId,
      empreendedor_id: empreendedorId,
      codigo_usado: codigo.trim().toUpperCase(),
      ativo: true,
    },
    { onConflict: "user_id" }
  );
  if (error) throw error;
}

async function grantSignupCoins(userId, withCode, refId) {
  const amount = withCode ? 100 : 20;
  const reason = withCode ? "cadastro_com_codigo" : "cadastro_sem_codigo";
  const liberaEm = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const sb = getSupabase();

  const { error: txErr } = await sb.from("coin_transactions").insert({
    user_id: userId,
    type: "earn",
    amount,
    reason,
    ref_id: refId ?? null,
    bloqueado: true,
    libera_em: liberaEm,
  });
  if (txErr) throw txErr;

  const { data: existing } = await sb
    .from("user_coins")
    .select("user_id, total_earned")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    const { error: updErr } = await sb
      .from("user_coins")
      .update({
        total_earned: (existing.total_earned ?? 0) + amount,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    if (updErr) throw updErr;
  } else {
    const { error: insErr } = await sb.from("user_coins").insert({
      user_id: userId,
      balance: 0,
      total_earned: amount,
    });
    if (insErr) throw insErr;
  }
}

/**
 * Cadastro novo trabalhador.
 */
async function signUpWorker({
  nome,
  celular,
  email,
  cep,
  cidade,
  estado,
  password,
  codigo,
  codigoValido,
  codigoEmpreendedorId,
}) {
  const sb = getSupabase();
  const emailNorm = String(email || "").trim().toLowerCase();
  if (!emailNorm.includes("@")) throw new Error("Informe um e-mail válido.");
  const cel = digitsOnly(celular);
  if (cel.length < 10) throw new Error("Informe um WhatsApp válido.");
  if (String(password || "").length < 8) {
    throw new Error("A senha deve ter no mínimo 8 caracteres.");
  }

  const { data, error } = await sb.auth.signUp({
    email: emailNorm,
    password,
    options: {
      data: { nome, tipo: "empregado" },
    },
  });

  if (error) {
    if (isAlreadyRegisteredError(error)) {
      return { existing: true, email: emailNorm };
    }
    throw error;
  }

  const user = data.user;
  const session = data.session;
  if (!user) throw new Error("Não foi possível criar a conta.");

  if (!user.identities || user.identities.length === 0) {
    return { existing: true, email: emailNorm };
  }

  if (!session) {
    return {
      ok: true,
      needsEmailConfirm: true,
      email: emailNorm,
      redirect: "/login-trabalhador.html",
    };
  }

  await ensureSessionOnClient(session);

  await upsertWorkerProfile(user.id, {
    nome,
    celular: cel,
    email: emailNorm,
    cep,
    cidade,
    estado,
  });

  if (codigoValido && codigoEmpreendedorId && codigo) {
    await linkEntrepreneurGroup(user.id, codigoEmpreendedorId, codigo);
    await grantSignupCoins(user.id, true, codigoEmpreendedorId);
  } else {
    await grantSignupCoins(user.id, false, null);
  }

  return { ok: true, redirect: "/vagas-disponiveis.html" };
}

async function signInWorker(email, password) {
  const sb = getSupabase();
  const emailNorm = String(email || "").trim().toLowerCase();
  const { data, error } = await sb.auth.signInWithPassword({
    email: emailNorm,
    password,
  });
  if (error) {
    const msg = (error.message || "").toLowerCase();
    if (msg.includes("invalid login") || msg.includes("invalid credentials")) {
      throw new Error("E-mail ou senha incorretos.");
    }
    throw error;
  }
  if (!data.session?.user) throw new Error("Sessão inválida.");
  await ensureSessionOnClient(data.session);
  return data.session;
}

async function fetchWorkerProfile(userId) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("users")
    .select("nome, cidade, estado, celular, email, cep, lat, lng, tipo")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function requireWorkerAuth(redirectTo = "/trabalhe.html") {
  const user = await getSessionUser();
  if (!user) {
    window.location.href = redirectTo;
    return null;
  }
  const profile = await fetchWorkerProfile(user.id);
  if (profile?.tipo && profile.tipo !== "empregado") {
    window.location.href = "/contrate.html";
    return null;
  }
  return user;
}

async function buscarCep(cep) {
  const d = digitsOnly(cep);
  if (d.length !== 8) return null;
  const res = await fetch(`https://viacep.com.br/ws/${d}/json/`);
  if (!res.ok) return null;
  const j = await res.json();
  if (j.erro) return null;
  return {
    cidade: j.localidade || "",
    estado: j.uf || "",
    bairro: j.bairro || "",
  };
}

window.TrabalhadorAuth = {
  SESSION_KEY,
  digitsOnly,
  maskPhone,
  maskCep,
  escapeHtml,
  getSupabase,
  saveSession,
  loadSession,
  getSessionUser,
  signOutWorker,
  signUpWorker,
  signInWorker,
  validateEntrepreneurCode,
  requireWorkerAuth,
  fetchWorkerProfile,
  buscarCep,
};

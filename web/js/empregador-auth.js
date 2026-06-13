/**
 * Auth + sessão Supabase para fluxo web do empregador.
 * Depende de: config.js, @supabase/supabase-js (CDN)
 */
const SESSION_KEY = "diaria_empregador_session";

function digitsOnly(s) {
  return String(s || "").replace(/\D/g, "");
}

function maskPhone(value) {
  const d = digitsOnly(value).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function defaultPasswordFromCelular(celular) {
  const d = digitsOnly(celular);
  return `${d}@diaria`;
}

function mapTipoContratante(tipo) {
  if (tipo === "mei") return "mei";
  if (tipo === "empresa") return "empresa";
  return "pessoa_fisica";
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

async function signOutEmployer() {
  const sb = getSupabase();
  await sb.auth.signOut();
  saveSession(null);
}

async function upsertEmployerProfile(userId, profile) {
  const sb = getSupabase();
  const row = {
    id: userId,
    nome: profile.nome,
    celular: profile.celular,
    email: profile.email || null,
    cidade: profile.cidade,
    estado: profile.estado || null,
    tipo: "empregador",
    tipo_contratante: mapTipoContratante(profile.tipoContratante),
    onboarding_completo: true,
  };
  const { error } = await sb.from("users").upsert(row, { onConflict: "id" });
  if (error) throw error;
}

function isAlreadyRegisteredError(err) {
  const msg = (err?.message || "").toLowerCase();
  const code = String(err?.code || "").toLowerCase();
  return (
    code === "user_already_registered" ||
    msg.includes("already registered") ||
    msg.includes("already been registered") ||
    msg.includes("user already registered") ||
    msg.includes("email address is already registered")
  );
}

/**
 * Cadastro novo empregador. Retorna { ok, redirect } ou lança / retorna { existing: true }
 */
async function signUpEmployer({ nome, celular, email, cidade, estado, tipoContratante }) {
  const sb = getSupabase();
  const emailNorm = String(email || "").trim().toLowerCase();
  if (!emailNorm.includes("@")) throw new Error("Informe um e-mail válido.");
  const cel = digitsOnly(celular);
  if (cel.length < 10) throw new Error("Informe um WhatsApp válido.");
  const password = defaultPasswordFromCelular(cel);

  const { data, error } = await sb.auth.signUp({
    email: emailNorm,
    password,
    options: {
      data: { nome, tipo: "empregador" },
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
      redirect: "/login-empregador.html",
    };
  }

  await ensureSessionOnClient(session);

  await upsertEmployerProfile(user.id, {
    nome: nome.trim(),
    celular: cel,
    email: emailNorm,
    cidade: cidade.trim(),
    estado: (estado || "").trim().slice(0, 2).toUpperCase(),
    tipoContratante,
  });

  return { ok: true, redirect: "/publicar-vaga.html" };
}

async function signInEmployer(email, password, profile) {
  const sb = getSupabase();
  const emailNorm = String(email || "").trim().toLowerCase();
  const { data, error } = await sb.auth.signInWithPassword({
    email: emailNorm,
    password,
  });
  if (error) {
    const msg = (error.message || "").toLowerCase();
    if (msg.includes("invalid login") || msg.includes("invalid credentials")) {
      throw new Error(
        "E-mail ou senha incorretos. Primeiro acesso na web: senha = WhatsApp só números + @diaria"
      );
    }
    throw error;
  }
  if (!data.session?.user) throw new Error("Sessão inválida.");
  await ensureSessionOnClient(data.session);
  if (profile) {
    await upsertEmployerProfile(data.session.user.id, profile);
  }
  return data.session;
}

async function requireAuth(redirectTo = "/contrate.html") {
  const user = await getSessionUser();
  if (!user) {
    window.location.href = redirectTo;
    return null;
  }
  return user;
}

async function fetchEmployerProfile(userId) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("users")
    .select("nome, cidade, celular, email")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function initWebHeader() {
  if (window.WebNav) {
    void WebNav.initWebNav();
    return;
  }
  const el = document.getElementById("web-nav-auth");
  if (!el) return;
  el.innerHTML = `<a href="/login-empregador.html" class="nav-link">Entrar</a>`;
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

window.EmpregadorAuth = {
  SESSION_KEY,
  digitsOnly,
  maskPhone,
  defaultPasswordFromCelular,
  getSupabase,
  saveSession,
  loadSession,
  getSessionUser,
  signOutEmployer,
  signUpEmployer,
  signInEmployer,
  requireAuth,
  fetchEmployerProfile,
  initWebHeader,
};

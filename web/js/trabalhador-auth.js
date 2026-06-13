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
  const code = String(err?.code || "").toLowerCase();
  return (
    code === "user_already_registered" ||
    msg.includes("already registered") ||
    msg.includes("already been registered") ||
    msg.includes("user already registered") ||
    msg.includes("email address is already registered")
  );
}

/** Supabase anti-enum: e-mail duplicado pode vir sem erro, só identities vazio. */
async function trySignInAfterDuplicate(sb, emailNorm, password) {
  const { data, error } = await sb.auth.signInWithPassword({
    email: emailNorm,
    password,
  });
  if (error || !data.session?.user) return null;
  return data.session;
}

async function finishWorkerSignupAfterSession(session, profile, codigo, codigoValido, codigoEmpreendedorId) {
  await ensureSessionOnClient(session);
  const userId = session.user.id;
  await upsertWorkerProfile(userId, profile);

  try {
    if (codigoValido && codigoEmpreendedorId && codigo) {
      await linkEntrepreneurGroup(userId, codigoEmpreendedorId, codigo);
      await grantSignupCoins(userId, true, codigoEmpreendedorId);
    } else {
      await grantSignupCoins(userId, false, null);
    }
  } catch (coinErr) {
    console.warn("Moedas/código pós-cadastro:", coinErr);
  }

  const landing = await resolveWorkerLanding(session.user);
  return { ok: true, redirect: landing };
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
  if (error) {
    const msg = (error.message || "").toLowerCase();
    if (error.code === "23505" || msg.includes("celular")) {
      throw new Error(
        "Este WhatsApp já está vinculado a outra conta. Entre com seu e-mail ou use outro número."
      );
    }
    throw error;
  }
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

  const profilePayload = {
    nome,
    celular: cel,
    email: emailNorm,
    cep,
    cidade,
    estado,
  };

  const { data, error } = await sb.auth.signUp({
    email: emailNorm,
    password,
    options: {
      data: {
        nome: nome.trim(),
        tipo: "empregado",
        celular: cel,
        cidade: (cidade || "").trim(),
        estado: (estado || "").trim().slice(0, 2).toUpperCase(),
        cep: digitsOnly(cep || ""),
      },
    },
  });

  if (error) {
    if (isAlreadyRegisteredError(error)) {
      const resumed = await trySignInAfterDuplicate(sb, emailNorm, password);
      if (resumed) {
        return finishWorkerSignupAfterSession(resumed, profilePayload, codigo, codigoValido, codigoEmpreendedorId);
      }
      return { existing: true, email: emailNorm };
    }
    throw error;
  }

  const user = data.user;
  const session = data.session;
  if (!user) throw new Error("Não foi possível criar a conta.");

  if (!user.identities || user.identities.length === 0) {
    const resumed = await trySignInAfterDuplicate(sb, emailNorm, password);
    if (resumed) {
      return finishWorkerSignupAfterSession(resumed, profilePayload, codigo, codigoValido, codigoEmpreendedorId);
    }
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

  return finishWorkerSignupAfterSession(session, profilePayload, codigo, codigoValido, codigoEmpreendedorId);
}

async function signInWorker(email, password) {
  const sb = getSupabase();
  const emailNorm = String(email || "").trim().toLowerCase();
  const { data, error } = await sb.auth.signInWithPassword({
    email: emailNorm,
    password,
  });
  if (error) {
    throw new Error(mapAuthError(error));
  }
  if (!data.session?.user) throw new Error("Sessão inválida.");
  await ensureSessionOnClient(data.session);
  await ensureWorkerProfileFromAuth(data.session.user);
  return data.session;
}

async function fetchWorkerProfile(userId) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("users")
    .select("nome, cidade, estado, celular, email, cep, lat, lng, tipo, onboarding_completo")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function ensureWorkerProfileFromAuth(user) {
  let profile = await fetchWorkerProfile(user.id);
  if (profile) return profile;

  const meta = user.user_metadata || {};
  const cel = digitsOnly(meta.celular || user.phone || "");
  const nome = String(meta.nome || meta.full_name || user.email?.split("@")[0] || "Usuário").trim();
  const cidade = String(meta.cidade || "Não informada").trim();
  const estado = String(meta.estado || "MT").trim().slice(0, 2).toUpperCase();

  if (cel.length < 10) {
    throw new Error(
      "Perfil incompleto. Cadastre-se de novo em Trabalhe ou complete seus dados."
    );
  }

  await upsertWorkerProfile(user.id, {
    nome,
    celular: cel,
    email: user.email,
    cep: meta.cep || "",
    cidade,
    estado,
  });
  profile = await fetchWorkerProfile(user.id);
  return profile;
}

async function completeWorkerWebOnboarding(userId, { skills, diasSemana, disponivelQualquerDia, skipAvailability }) {
  const sb = getSupabase();
  if (!skills?.length) {
    throw new Error("Escolha pelo menos uma habilidade.");
  }

  await sb.from("user_skills").delete().eq("user_id", userId);
  const { error: skErr } = await sb.from("user_skills").insert(
    skills.map((skill) => ({ user_id: userId, skill }))
  );
  if (skErr) throw skErr;

  const dias = disponivelQualquerDia
    ? [0, 1, 2, 3, 4, 5, 6]
    : skipAvailability
      ? [1, 2, 3, 4, 5]
      : diasSemana?.length
        ? diasSemana
        : [1, 2, 3, 4, 5];

  const fullPayload = {
    user_id: userId,
    dias_semana: dias,
    datas_especificas: null,
    turnos: ["manha", "tarde"],
    raio_km: 10,
    recorrente: true,
    disponivel_qualquer_dia: Boolean(disponivelQualquerDia),
    horas_por_dia: 8,
    horas_por_semana: 40,
    tipo_jornada: ["diarias_avulsas"],
    updated_at: new Date().toISOString(),
  };

  let { error: availErr } = await sb.from("user_availability").upsert(fullPayload, {
    onConflict: "user_id",
  });
  if (availErr) {
    const minimal = {
      user_id: userId,
      dias_semana: dias,
      datas_especificas: null,
      turnos: ["manha", "tarde"],
      raio_km: 10,
      recorrente: true,
      updated_at: new Date().toISOString(),
    };
    const retry = await sb.from("user_availability").upsert(minimal, { onConflict: "user_id" });
    availErr = retry.error;
  }
  if (availErr) throw availErr;

  const { error: userErr } = await sb
    .from("users")
    .update({ onboarding_completo: true })
    .eq("id", userId);
  if (userErr) throw userErr;
}

function mapAuthError(error) {
  const msg = (error?.message || "").toLowerCase();
  if (msg.includes("invalid login") || msg.includes("invalid credentials")) {
    return "E-mail ou senha incorretos.";
  }
  if (msg.includes("email not confirmed") || msg.includes("not confirmed")) {
    return "Confirme seu e-mail antes de entrar. Verifique a caixa de entrada e o spam.";
  }
  return error?.message || "Não foi possível autenticar.";
}

async function resolveWorkerLanding(user) {
  await ensureWorkerProfileFromAuth(user);
  const profile = await fetchWorkerProfile(user.id);
  if (profile?.tipo && profile.tipo !== "empregado") {
    return "/contrate.html";
  }
  if (profile?.onboarding_completo !== true) {
    return "/completar-perfil-trabalhador.html";
  }
  return "/vagas-disponiveis.html";
}

async function requireWorkerAuth(redirectTo = "/trabalhe.html") {
  const user = await getSessionUser();
  if (!user) {
    window.location.href = redirectTo;
    return null;
  }
  try {
    const profile = await ensureWorkerProfileFromAuth(user);
    if (profile?.tipo && profile.tipo !== "empregado") {
      window.location.href = "/contrate.html";
      return null;
    }
  } catch (e) {
    console.error(e);
    await signOutWorker();
    window.location.href = redirectTo;
    return null;
  }
  return user;
}

async function requireWorkerOnboardingComplete(redirectTo = "/trabalhe.html") {
  const user = await requireWorkerAuth(redirectTo);
  if (!user) return null;
  const profile = await fetchWorkerProfile(user.id);
  if (profile?.onboarding_completo !== true) {
    window.location.href = "/completar-perfil-trabalhador.html";
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
  requireWorkerOnboardingComplete,
  fetchWorkerProfile,
  ensureWorkerProfileFromAuth,
  completeWorkerWebOnboarding,
  resolveWorkerLanding,
  buscarCep,
};

/**
 * Auth + sessão Supabase para fluxo web do trabalhador (empregado).
 * Depende de: config.js, @supabase/supabase-js (CDN)
 */
const SESSION_KEY = "diaria_trabalhador_session";
const AUTH_MSG_KEY = "diaria_worker_auth_msg";

function logCadastro(event, meta = {}) {
  console.info("[TRABALHADOR_CADASTRO]", {
    event,
    ts: new Date().toISOString(),
    ...meta,
  });
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function classifySignInFailure(error) {
  const msg = (error?.message || "").toLowerCase();
  if (msg.includes("email not confirmed") || msg.includes("not confirmed")) {
    return "email_not_confirmed";
  }
  if (msg.includes("invalid login") || msg.includes("invalid credentials")) {
    return "wrong_password";
  }
  return "unknown";
}

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

async function signInWithPasswordDetailed(sb, emailNorm, password) {
  const { data, error } = await sb.auth.signInWithPassword({
    email: emailNorm,
    password,
  });
  if (error || !data.session?.user) {
    return { ok: false, error: error || { message: "Sessão inválida." } };
  }
  return { ok: true, session: data.session };
}

async function hasSignupCoinsGranted(userId) {
  const sb = getSupabase();
  const { data } = await sb
    .from("coin_transactions")
    .select("id")
    .eq("user_id", userId)
    .in("reason", ["cadastro_sem_codigo", "cadastro_com_codigo"])
    .limit(1);
  return Boolean(data?.length);
}

async function grantSignupCoinsIfNeeded(userId, codigo, codigoValido, codigoEmpreendedorId) {
  if (await hasSignupCoinsGranted(userId)) return;
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
}

async function mergeWorkerProfileFromSignup(userId, profile, existing) {
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
    termo_aceito_em: existing?.termo_aceito_em || new Date().toISOString(),
    onboarding_completo: existing?.onboarding_completo === true,
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

/**
 * Após sessão autenticada (cadastro novo ou e-mail já existente).
 * Retorna objeto com `type` para a UI.
 */
async function resolveWorkerSignupAfterSession(
  session,
  profile,
  codigo,
  codigoValido,
  codigoEmpreendedorId,
  source
) {
  await ensureSessionOnClient(session);
  const userId = session.user.id;
  let existing = await fetchWorkerProfile(userId);

  if (existing && existing.tipo && existing.tipo !== "empregado") {
    logCadastro("TRABALHADOR_CADASTRO_TIPO_CONFLITO", { userId, tipo: existing.tipo });
    return {
      type: "profile_type_conflict",
      email: profile.email,
      message:
        "Este e-mail já está em uso como outro perfil (contratante ou parceiro). Entre pela área correta ou use outro e-mail.",
    };
  }

  const profileMissing = !existing;
  if (profileMissing) {
    await upsertWorkerProfile(userId, profile);
    logCadastro(
      source === "duplicate" ? "TRABALHADOR_PERFIL_AUSENTE_RECRIADO" : "TRABALHADOR_PERFIL_CRIADO",
      { userId }
    );
    existing = await fetchWorkerProfile(userId);
    await grantSignupCoinsIfNeeded(userId, codigo, codigoValido, codigoEmpreendedorId);
  } else if (existing.onboarding_completo !== true) {
    await mergeWorkerProfileFromSignup(userId, profile, existing);
    logCadastro("TRABALHADOR_CADASTRO_RETOMADO", { userId });
    existing = await fetchWorkerProfile(userId);
    await grantSignupCoinsIfNeeded(userId, codigo, codigoValido, codigoEmpreendedorId);
  } else {
    logCadastro("TRABALHADOR_CADASTRO_COMPLETO_EXISTENTE", { userId });
    const landing = await resolveWorkerLanding(session.user);
    return {
      type: "already_complete",
      email: profile.email,
      redirectTo: landing,
      message: "Este e-mail já possui cadastro. Acesse sua conta com sua senha.",
    };
  }

  const redirectTo = await resolveWorkerLanding(session.user);
  if (profileMissing && source === "signup") {
    return {
      type: "created",
      email: profile.email,
      redirectTo,
      message: "Conta criada! Redirecionando…",
    };
  }
  if (profileMissing) {
    return {
      type: "auth_without_profile",
      email: profile.email,
      redirectTo,
      message:
        "Encontramos seu acesso, mas seu perfil ainda não foi finalizado. Vamos completar agora.",
    };
  }
  return {
    type: "resume_onboarding",
    email: profile.email,
    redirectTo,
    message:
      "Encontramos um cadastro iniciado com este e-mail. Vamos continuar de onde você parou.",
  };
}

async function handleDuplicateEmailSignup(sb, emailNorm, password, profilePayload, codigo, codigoValido, codigoEmpreendedorId) {
  logCadastro("TRABALHADOR_AUTH_EXISTENTE", { email: emailNorm });
  const signIn = await signInWithPasswordDetailed(sb, emailNorm, password);
  if (signIn.ok) {
    logCadastro("TRABALHADOR_SIGNIN_DUPLICADO_SUCESSO", { userId: signIn.session.user.id });
    return resolveWorkerSignupAfterSession(
      signIn.session,
      profilePayload,
      codigo,
      codigoValido,
      codigoEmpreendedorId,
      "duplicate"
    );
  }

  logCadastro("TRABALHADOR_SIGNIN_DUPLICADO_FALHOU", {
    reason: classifySignInFailure(signIn.error),
  });
  const kind = classifySignInFailure(signIn.error);
  if (kind === "email_not_confirmed") {
    logCadastro("TRABALHADOR_CADASTRO_EMAIL_NAO_CONFIRMADO", { email: emailNorm });
    return {
      type: "email_not_confirmed",
      email: emailNorm,
      message:
        "Seu cadastro foi iniciado, mas o e-mail ainda precisa ser confirmado. Verifique sua caixa de entrada.",
    };
  }
  if (kind === "wrong_password") {
    logCadastro("TRABALHADOR_CADASTRO_SENHA_INVALIDA", { email: emailNorm });
    return {
      type: "wrong_password_existing_email",
      email: emailNorm,
      message:
        "Este e-mail já possui cadastro. Informe a senha correta ou use recuperação de senha.",
    };
  }
  return {
    type: "wrong_password_existing_email",
    email: emailNorm,
    message:
      "Este e-mail já possui um cadastro iniciado. Entre com sua senha ou use recuperação de senha para continuar.",
  };
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
  const emailNorm = normalizeEmail(email);
  if (!emailNorm.includes("@")) throw new Error("Informe um e-mail válido.");
  const cel = digitsOnly(celular);
  if (cel.length < 10) throw new Error("Informe um WhatsApp válido.");
  if (String(password || "").length < 8) {
    throw new Error("A senha deve ter no mínimo 8 caracteres.");
  }

  logCadastro("TRABALHADOR_CADASTRO_INICIADO", { email: emailNorm, channel: "web" });

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
      return handleDuplicateEmailSignup(
        sb,
        emailNorm,
        password,
        profilePayload,
        codigo,
        codigoValido,
        codigoEmpreendedorId
      );
    }
    logCadastro("TRABALHADOR_CADASTRO_ERRO_DESCONHECIDO", { message: error.message });
    throw error;
  }

  const user = data.user;
  const session = data.session;
  if (!user) throw new Error("Não foi possível criar a conta.");

  if (!user.identities || user.identities.length === 0) {
    return handleDuplicateEmailSignup(
      sb,
      emailNorm,
      password,
      profilePayload,
      codigo,
      codigoValido,
      codigoEmpreendedorId
    );
  }

  if (!session) {
    logCadastro("TRABALHADOR_CADASTRO_EMAIL_NAO_CONFIRMADO", { email: emailNorm });
    return {
      type: "email_not_confirmed",
      email: emailNorm,
      message:
        "Conta criada! Confirme o e-mail que enviamos e depois entre para continuar o cadastro.",
      redirectTo: "/login-trabalhador.html",
    };
  }

  logCadastro("TRABALHADOR_AUTH_CRIADO", { userId: user.id });
  return resolveWorkerSignupAfterSession(
    session,
    profilePayload,
    codigo,
    codigoValido,
    codigoEmpreendedorId,
    "signup"
  );
}

async function signInWorker(email, password) {
  const sb = getSupabase();
  const emailNorm = normalizeEmail(email);
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

  let profile = await fetchWorkerProfile(userId);
  if (!profile) {
    const { data: authData } = await sb.auth.getUser();
    const authUser = authData.user;
    if (!authUser) {
      throw new Error("Sua sessão expirou. Entre novamente para continuar seu cadastro.");
    }
    await ensureWorkerProfileFromAuth(authUser);
    profile = await fetchWorkerProfile(userId);
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

  logCadastro("TRABALHADOR_ONBOARDING_FINALIZADO", { userId });
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

async function requireWorkerAuth(redirectTo = "/trabalhe.html", options = {}) {
  const user = await getSessionUser();
  if (!user) {
    if (options.sessionExpiredMessage) {
      try {
        sessionStorage.setItem(AUTH_MSG_KEY, options.sessionExpiredMessage);
      } catch {
        /* ignore */
      }
    }
    window.location.href = options.loginRedirect || redirectTo;
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
    if (options.sessionExpiredMessage) {
      try {
        sessionStorage.setItem(AUTH_MSG_KEY, options.sessionExpiredMessage);
      } catch {
        /* ignore */
      }
    }
    window.location.href = options.loginRedirect || redirectTo;
    return null;
  }
  return user;
}

async function redirectLoggedInWorkerFromSignupPage() {
  const user = await getSessionUser();
  if (!user) return false;
  try {
    const landing = await resolveWorkerLanding(user);
    window.location.replace(landing);
    return true;
  } catch (e) {
    console.warn("redirectLoggedInWorkerFromSignupPage:", e);
    return false;
  }
}

function consumeAuthFlashMessage() {
  try {
    const msg = sessionStorage.getItem(AUTH_MSG_KEY);
    if (msg) sessionStorage.removeItem(AUTH_MSG_KEY);
    return msg;
  } catch {
    return null;
  }
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
  AUTH_MSG_KEY,
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
  redirectLoggedInWorkerFromSignupPage,
  consumeAuthFlashMessage,
  buscarCep,
  logCadastro,
};

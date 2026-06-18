import { resolveAppRoute } from "./authRouting";
import { fetchOnboardingStatus } from "./empregadoOnboarding";
import { supabase, upsertUserProfile, type UserTipo } from "./supabase";

export type EmpregadoRegisterOutcome =
  | { type: "created"; userId: string; route: string }
  | { type: "resume_onboarding"; userId: string; route: string; message: string }
  | { type: "already_complete"; userId: string; route: string; message: string }
  | { type: "auth_without_profile"; userId: string; route: string; message: string }
  | { type: "email_not_confirmed"; message: string }
  | { type: "wrong_password"; message: string }
  | { type: "profile_type_conflict"; message: string; tipo: string }
  | { type: "error"; message: string };

function logCadastro(event: string, meta: Record<string, unknown> = {}) {
  console.info("[TRABALHADOR_CADASTRO]", {
    event,
    ts: new Date().toISOString(),
    ...meta,
  });
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isAlreadyRegisteredError(err: { message?: string; code?: string }) {
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

function classifySignInFailure(error: { message?: string }) {
  const msg = (error?.message || "").toLowerCase();
  if (msg.includes("email not confirmed") || msg.includes("not confirmed")) {
    return "email_not_confirmed" as const;
  }
  if (msg.includes("invalid login") || msg.includes("invalid credentials")) {
    return "wrong_password" as const;
  }
  return "unknown" as const;
}

async function resolveAfterSignIn(
  userId: string,
  profileInput: {
    nome: string;
    celular: string;
    email: string;
    tipo: UserTipo;
  },
  source: "signup" | "duplicate"
): Promise<EmpregadoRegisterOutcome> {
  const status = await fetchOnboardingStatus(userId);

  if (status && status.tipo !== "empregado") {
    logCadastro("TRABALHADOR_CADASTRO_TIPO_CONFLITO", { userId, tipo: status.tipo });
    return {
      type: "profile_type_conflict",
      message:
        "Este e-mail já está vinculado a outro tipo de conta. Entre com o perfil correto ou use outro e-mail.",
      tipo: status.tipo,
    };
  }

  if (!status) {
    await upsertUserProfile({
      id: userId,
      nome: profileInput.nome,
      celular: profileInput.celular,
      email: profileInput.email,
      tipo: "empregado",
    });
    logCadastro(
      source === "duplicate"
        ? "TRABALHADOR_PERFIL_AUSENTE_RECRIADO"
        : "TRABALHADOR_PERFIL_CRIADO",
      { userId }
    );
    const route = await resolveAppRoute(userId);
    return {
      type: source === "duplicate" ? "auth_without_profile" : "created",
      userId,
      route,
      message:
        "Encontramos seu acesso, mas seu perfil ainda não foi finalizado. Vamos completar agora.",
    };
  }

  if (status.onboarding_completo === true) {
    logCadastro("TRABALHADOR_CADASTRO_COMPLETO_EXISTENTE", { userId });
    const route = await resolveAppRoute(userId);
    return {
      type: "already_complete",
      userId,
      route,
      message: "Este e-mail já possui cadastro. Você será direcionado para o app.",
    };
  }

  logCadastro("TRABALHADOR_CADASTRO_RETOMADO", { userId });
  const route = await resolveAppRoute(userId);
  return {
    type: "resume_onboarding",
    userId,
    route,
    message:
      "Encontramos um cadastro iniciado com este e-mail. Vamos continuar de onde você parou.",
  };
}

export async function registerEmpregado(input: {
  nome: string;
  celular: string;
  email: string;
  senha: string;
}): Promise<EmpregadoRegisterOutcome> {
  const emailNorm = normalizeEmail(input.email);
  const nome = input.nome.trim();
  const celular = input.celular.replace(/\D/g, "");

  logCadastro("TRABALHADOR_CADASTRO_INICIADO", { channel: "app" });

  const profileInput = {
    nome,
    celular,
    email: emailNorm,
    tipo: "empregado" as const,
  };

  const { data, error } = await supabase.auth.signUp({
    email: emailNorm,
    password: input.senha,
    options: {
      data: { nome, celular: input.celular, tipo: "empregado", email: emailNorm },
    },
  });

  const tryDuplicateSignIn = async (): Promise<EmpregadoRegisterOutcome> => {
    logCadastro("TRABALHADOR_AUTH_EXISTENTE", { email: emailNorm });
    const signIn = await supabase.auth.signInWithPassword({
      email: emailNorm,
      password: input.senha,
    });
    if (signIn.error || !signIn.data.user) {
      logCadastro("TRABALHADOR_SIGNIN_DUPLICADO_FALHOU", {
        reason: classifySignInFailure(signIn.error || { message: "" }),
      });
      const kind = classifySignInFailure(signIn.error || { message: "" });
      if (kind === "email_not_confirmed") {
        logCadastro("TRABALHADOR_CADASTRO_EMAIL_NAO_CONFIRMADO", { email: emailNorm });
        return {
          type: "email_not_confirmed",
          message:
            "Seu cadastro foi iniciado, mas o e-mail ainda precisa ser confirmado. Verifique sua caixa de entrada.",
        };
      }
      if (kind === "wrong_password") {
        logCadastro("TRABALHADOR_CADASTRO_SENHA_INVALIDA", { email: emailNorm });
        return {
          type: "wrong_password",
          message:
            "Este e-mail já possui cadastro. Informe a senha correta ou use recuperação de senha na tela de entrar.",
        };
      }
      return {
        type: "wrong_password",
        message:
          "Este e-mail já possui um cadastro iniciado. Entre com sua senha ou use recuperação de senha para continuar.",
      };
    }
    logCadastro("TRABALHADOR_SIGNIN_DUPLICADO_SUCESSO", { userId: signIn.data.user.id });
    return resolveAfterSignIn(signIn.data.user.id, profileInput, "duplicate");
  };

  if (error) {
    if (isAlreadyRegisteredError(error)) {
      return tryDuplicateSignIn();
    }
    logCadastro("TRABALHADOR_CADASTRO_ERRO_DESCONHECIDO", { message: error.message });
    return { type: "error", message: error.message };
  }

  const user = data.user;
  if (!user) {
    return { type: "error", message: "Não foi possível criar a conta." };
  }

  if (!user.identities?.length) {
    return tryDuplicateSignIn();
  }

  if (!data.session) {
    logCadastro("TRABALHADOR_CADASTRO_EMAIL_NAO_CONFIRMADO", { email: emailNorm });
    return {
      type: "email_not_confirmed",
      message:
        "Conta criada! Confirme o e-mail que enviamos e depois entre para continuar o cadastro.",
    };
  }

  logCadastro("TRABALHADOR_AUTH_CRIADO", { userId: user.id });
  try {
    await upsertUserProfile({
      id: user.id,
      nome,
      celular: input.celular,
      email: emailNorm,
      tipo: "empregado",
    });
    logCadastro("TRABALHADOR_PERFIL_CRIADO", { userId: user.id });
  } catch (e) {
    logCadastro("TRABALHADOR_CADASTRO_ERRO_DESCONHECIDO", {
      userId: user.id,
      message: e instanceof Error ? e.message : String(e),
    });
    return {
      type: "error",
      message: e instanceof Error ? e.message : "Erro ao salvar perfil.",
    };
  }

  const route = await resolveAppRoute(user.id);
  return { type: "created", userId: user.id, route };
}

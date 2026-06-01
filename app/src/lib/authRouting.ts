import { fetchOnboardingStatus } from "./empregadoOnboarding";

export type AppRoute =
  | "/(auth)/choose-profile"
  | "/(onboarding)/empregado/dados"
  | "/(onboarding)/empregador/localizacao"
  | "/(onboarding)/empreendedor/personal"
  | "/(app)/(empregado)/vagas"
  | "/(app)/(empregador)/painel"
  | "/(app)/(empreendedor)/painel"
  | "/(app)/(admin)/dashboard";

export async function resolveAppRoute(userId: string): Promise<AppRoute> {
  const status = await fetchOnboardingStatus(userId);
  if (!status) return "/(auth)/choose-profile";

  if (status.onboarding_completo !== true) {
    if (status.tipo === "empregado") return "/(onboarding)/empregado/dados";
    if (status.tipo === "empregador") return "/(onboarding)/empregador/localizacao";
    if (status.tipo === "empreendedor") return "/(onboarding)/empreendedor/personal";
    return "/(auth)/choose-profile";
  }

  if (status.tipo === "empregado") return "/(app)/(empregado)/vagas";
  if (status.tipo === "empregador") return "/(app)/(empregador)/painel";
  if (status.tipo === "empreendedor") return "/(app)/(empreendedor)/painel";
  if (status.tipo === "admin_master") return "/(app)/(admin)/dashboard";
  return "/(auth)/choose-profile";
}

/** @deprecated use resolveAppRoute */
export async function routeAfterAuth(userId: string): Promise<AppRoute> {
  return resolveAppRoute(userId);
}

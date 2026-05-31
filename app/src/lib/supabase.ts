import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const url = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseConfigured = Boolean(url && anon);

export const supabase = createClient(url, anon, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export type UserTipo = "empregado" | "empregador" | "empreendedor";

export async function upsertUserProfile(input: {
  id: string;
  nome: string;
  celular: string;
  email?: string | null;
  tipo: UserTipo;
  termoVersao?: string;
}) {
  const { error } = await supabase.from("users").upsert(
    {
      id: input.id,
      nome: input.nome,
      celular: input.celular.replace(/\D/g, ""),
      email: input.email ?? null,
      tipo: input.tipo,
      termo_aceito_em: new Date().toISOString(),
      termo_versao: input.termoVersao ?? "v1.0",
      onboarding_completo: input.tipo !== "empregado",
    },
    { onConflict: "id" }
  );
  if (error) throw error;
}

import AsyncStorage from "@react-native-async-storage/async-storage";
import { earnCoins } from "./coins";
import { supabase } from "./supabase";

const PROFILE_COINS_KEY = "perfil_completo_coins_awarded";

/** Alinhado ao limite do bucket `avatars` no Supabase Storage (20 MB). */
export const AVATAR_MAX_BYTES = 20 * 1024 * 1024;

export type ProfileCompletion = {
  percent: number;
  missing: string[];
};

export async function updateProfile(
  userId: string,
  data: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.from("users").update(data).eq("id", userId);
  if (error) throw error;
}

export async function uploadAvatar(userId: string, imageUri: string): Promise<string> {
  const res = await fetch(imageUri);
  const blob = await res.blob();
  if (blob.size > AVATAR_MAX_BYTES) {
    throw new Error("A foto é muito grande. Use uma imagem de até 20 MB.");
  }
  const path = `${userId}/avatar.jpg`;
  const { error: upErr } = await supabase.storage.from("avatars").upload(path, blob, {
    contentType: "image/jpeg",
    upsert: true,
  });
  if (upErr) throw upErr;
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const url = `${data.publicUrl}?t=${Date.now()}`;
  await updateProfile(userId, { foto_url: url });
  return url;
}

export async function getProfileCompletion(userId: string): Promise<ProfileCompletion> {
  const { data: user } = await supabase
    .from("users")
    .select("foto_url, bio, celular_visivel")
    .eq("id", userId)
    .maybeSingle();

  const { data: skills } = await supabase.from("user_skills").select("skill").eq("user_id", userId);
  const { count: expCount } = await supabase
    .from("user_experiences")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  const { data: avail } = await supabase
    .from("user_availability")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  let percent = 0;
  const missing: string[] = [];

  if (user?.foto_url) percent += 20;
  else missing.push("Adicione uma foto");

  if (user?.bio && user.bio.trim().length >= 10) percent += 10;
  else missing.push("Conte sobre você");

  if ((skills?.length ?? 0) >= 3) percent += 20;
  else missing.push("Escolha pelo menos 3 habilidades");

  if ((expCount ?? 0) >= 1) percent += 20;
  else missing.push("Adicione uma experiência");

  if (avail) percent += 15;
  else missing.push("Defina sua disponibilidade");

  if (user?.celular_visivel) percent += 15;
  else missing.push("Deixe seu celular visível (opcional)");

  return { percent: Math.min(100, percent), missing };
}

export async function maybeAwardProfileCompleteCoins(userId: string): Promise<boolean> {
  const { percent } = await getProfileCompletion(userId);
  if (percent < 100) return false;
  const awarded = await AsyncStorage.getItem(`${PROFILE_COINS_KEY}_${userId}`);
  if (awarded) return false;
  await earnCoins(userId, 20, "perfil_completo", userId);
  await AsyncStorage.setItem(`${PROFILE_COINS_KEY}_${userId}`, "1");
  return true;
}

export async function countCompletedDiarias(userId: string): Promise<number> {
  const { count } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("candidato_id", userId)
    .eq("status", "concluida");
  return count ?? 0;
}

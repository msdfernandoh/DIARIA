import { supabase } from "./supabase";

const SIGNUP_AMOUNTS = {
  empregado: { withCode: 100, withoutCode: 20 },
  empregador: { withCode: 50, withoutCode: 10 },
} as const;

export type CoinProfile = keyof typeof SIGNUP_AMOUNTS;

export type CoinTransactionRow = {
  id: string;
  type: "earn" | "spend";
  amount: number;
  reason: string;
  bloqueado: boolean;
  libera_em: string | null;
  created_at: string;
};

export type CoinWallet = {
  balance: number;
  totalEarned: number;
  blockedTotal: number;
  available: number;
};

export async function grantSignupCoins(
  userId: string,
  profile: CoinProfile,
  withCode: boolean,
  refId?: string | null
) {
  const amount = withCode
    ? SIGNUP_AMOUNTS[profile].withCode
    : SIGNUP_AMOUNTS[profile].withoutCode;
  await earnCoins(userId, amount, withCode ? "cadastro_com_codigo" : "cadastro_sem_codigo", refId, true);
}

export async function getCoinWallet(userId: string): Promise<CoinWallet> {
  const { data: wallet } = await supabase
    .from("user_coins")
    .select("balance, total_earned")
    .eq("user_id", userId)
    .maybeSingle();

  const { data: blockedRows } = await supabase
    .from("coin_transactions")
    .select("amount")
    .eq("user_id", userId)
    .eq("bloqueado", true)
    .eq("type", "earn")
    .gt("libera_em", new Date().toISOString());

  const balance = wallet?.balance ?? 0;
  const blockedTotal = (blockedRows ?? []).reduce((s, r) => s + r.amount, 0);

  return {
    balance,
    totalEarned: wallet?.total_earned ?? 0,
    blockedTotal,
    available: balance,
  };
}

export async function fetchCoinTransactions(
  userId: string,
  limit = 50
): Promise<CoinTransactionRow[]> {
  const { data, error } = await supabase
    .from("coin_transactions")
    .select("id, type, amount, reason, bloqueado, libera_em, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as CoinTransactionRow[];
}

/** Libera moedas com libera_em vencido: credita balance e desmarca bloqueio. */
export async function checkAndUnlockCoins(userId: string): Promise<number> {
  const now = new Date().toISOString();
  const { data: pending } = await supabase
    .from("coin_transactions")
    .select("id, amount")
    .eq("user_id", userId)
    .eq("bloqueado", true)
    .eq("type", "earn")
    .lte("libera_em", now);

  if (!pending?.length) return 0;

  let unlocked = 0;
  for (const tx of pending) {
    const { data: wallet } = await supabase
      .from("user_coins")
      .select("balance")
      .eq("user_id", userId)
      .maybeSingle();
    const newBalance = (wallet?.balance ?? 0) + tx.amount;
    const { error: wErr } = await supabase
      .from("user_coins")
      .update({ balance: newBalance, updated_at: now })
      .eq("user_id", userId);
    if (wErr) continue;

    await supabase.from("coin_transactions").update({ bloqueado: false }).eq("id", tx.id);
    unlocked += tx.amount;
  }
  return unlocked;
}

export async function earnCoins(
  userId: string,
  amount: number,
  reason: string,
  refId?: string | null,
  blocked = false
) {
  if (amount <= 0) throw new Error("Valor inválido");
  const liberaEm = blocked
    ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { error: txErr } = await supabase.from("coin_transactions").insert({
    user_id: userId,
    type: "earn",
    amount,
    reason,
    ref_id: refId ?? null,
    bloqueado: blocked,
    libera_em: liberaEm,
  });
  if (txErr) throw txErr;

  const { data: existing } = await supabase
    .from("user_coins")
    .select("balance, total_earned")
    .eq("user_id", userId)
    .maybeSingle();

  const totalEarned = (existing?.total_earned ?? 0) + amount;
  const balance = (existing?.balance ?? 0) + (blocked ? 0 : amount);

  if (existing) {
    const { error: updErr } = await supabase
      .from("user_coins")
      .update({
        balance,
        total_earned: totalEarned,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId);
    if (updErr) throw updErr;
  } else {
    const { error: insErr } = await supabase.from("user_coins").insert({
      user_id: userId,
      balance,
      total_earned: totalEarned,
    });
    if (insErr) throw insErr;
  }
}

export async function spendCoins(
  userId: string,
  amount: number,
  reason: string,
  refId?: string | null
): Promise<{ success: true; newBalance: number }> {
  if (amount <= 0) throw new Error("Valor inválido");

  const wallet = await getCoinWallet(userId);
  if (wallet.available < amount) {
    throw new Error("INSUFFICIENT");
  }

  const { error: txErr } = await supabase.from("coin_transactions").insert({
    user_id: userId,
    type: "spend",
    amount,
    reason,
    ref_id: refId ?? null,
    bloqueado: false,
  });
  if (txErr) throw txErr;

  const newBalance = wallet.balance - amount;
  const { error: updErr } = await supabase
    .from("user_coins")
    .update({ balance: newBalance, updated_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (updErr) throw updErr;

  return { success: true, newBalance };
}

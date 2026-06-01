import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Body = {
  user_id?: string;
  user_ids?: string[];
  titulo?: string;
  corpo?: string;
  data?: Record<string, unknown>;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON inválido" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const titulo = (body.titulo ?? "").trim();
  const corpo = (body.corpo ?? "").trim();
  if (!titulo || !corpo) {
    return new Response(JSON.stringify({ error: "titulo e corpo obrigatórios" }), {
      status: 422,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const targetIds = [
    ...(body.user_ids ?? []),
    ...(body.user_id ? [body.user_id] : []),
  ].filter(Boolean);
  const uniqueIds = [...new Set(targetIds)];
  if (!uniqueIds.length) {
    return new Response(JSON.stringify({ sent: 0, errors: ["no targets"] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const { data: tokens, error: tokErr } = await supabase
    .from("user_push_tokens")
    .select("token")
    .in("user_id", uniqueIds);

  if (tokErr) {
    console.error(tokErr);
    return new Response(JSON.stringify({ sent: 0, errors: [tokErr.message] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!tokens?.length) {
    return new Response(JSON.stringify({ sent: 0, errors: [] }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const payload = tokens.map((t) => ({
    to: t.token,
    title: titulo,
    body: corpo,
    data: body.data ?? {},
    sound: "default",
    badge: 1,
  }));

  const errors: string[] = [];
  try {
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      errors.push(JSON.stringify(json));
    } else if (Array.isArray(json?.data)) {
      json.data.forEach((item: { status?: string; message?: string }) => {
        if (item.status === "error" && item.message) errors.push(item.message);
      });
    }
  } catch (e) {
    errors.push(String(e));
    console.error(e);
  }

  return new Response(
    JSON.stringify({ sent: payload.length, errors }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});

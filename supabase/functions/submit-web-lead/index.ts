import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type LeadPayload = {
  nome?: string;
  celular?: string;
  cidade?: string;
  estado?: string;
  email?: string;
  tipo_interesse?: string;
  origem_pagina?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  website?: string;
};

const TIPOS = new Set(["empregado", "empregador", "empreendedor", "geral"]);
const ORIGENS = new Set(["institucional", "trabalhe", "contrate", "parceiro"]);

function normalizePhone(raw: string): string {
  return raw.replace(/\D/g, "");
}

function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip);
  return crypto.subtle.digest("SHA-256", data).then((buf) =>
    Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

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

  let body: LeadPayload;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "JSON inválido" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (body.website) {
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const nome = (body.nome ?? "").trim();
  const celular = normalizePhone(body.celular ?? "");
  const cidade = (body.cidade ?? "").trim();
  const estado = (body.estado ?? "").trim().slice(0, 2).toUpperCase() || null;
  const email = (body.email ?? "").trim() || null;
  const tipo = body.tipo_interesse ?? "";
  const origem = body.origem_pagina ?? "";

  if (nome.length < 2 || nome.length > 120) {
    return new Response(JSON.stringify({ error: "Nome inválido" }), {
      status: 422,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (celular.length < 10 || celular.length > 11) {
    return new Response(JSON.stringify({ error: "Celular inválido" }), {
      status: 422,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (cidade.length < 2) {
    return new Response(JSON.stringify({ error: "Cidade inválida" }), {
      status: 422,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!TIPOS.has(tipo) || !ORIGENS.has(origem)) {
    return new Response(JSON.stringify({ error: "Tipo ou origem inválidos" }), {
      status: 422,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const ip_hash = await hashIp(ip);

  const { data, error } = await supabase
    .from("web_leads")
    .insert({
      nome,
      celular,
      cidade,
      estado,
      email,
      tipo_interesse: tipo,
      origem_pagina: origem,
      utm_source: body.utm_source ?? null,
      utm_medium: body.utm_medium ?? null,
      utm_campaign: body.utm_campaign ?? null,
      ip_hash,
    })
    .select("id")
    .single();

  if (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: "Falha ao salvar lead" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, id: data.id }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});

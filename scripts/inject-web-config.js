const fs = require("fs");
const path = require("path");

function pick(...keys) {
  for (const k of keys) {
    const v = process.env[k];
    if (v && String(v).trim()) return String(v).trim();
  }
  return "";
}

const url = pick(
  "SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_URL",
  "EXPO_PUBLIC_SUPABASE_URL"
);
const anon = pick(
  "SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "EXPO_PUBLIC_SUPABASE_ANON_KEY"
);

const out = path.join(__dirname, "..", "web", "js", "config.js");
const content = `window.DIARIA_CONFIG = {
  supabaseUrl: ${JSON.stringify(url)},
  supabaseAnonKey: ${JSON.stringify(anon)},
};
`;

fs.writeFileSync(out, content, "utf8");

if (process.env.VERCEL === "1" && (!url || !anon)) {
  console.error(
    "ERRO: SUPABASE_URL ou SUPABASE_ANON_KEY ausentes no build Vercel. " +
      "Integração Supabase → Redeploy, ou adicione NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY."
  );
  process.exit(1);
}

console.log(
  "Wrote",
  out,
  url ? "(URL ok)" : "(SUPABASE_URL missing — ok só em dev local)"
);

const fs = require("fs");
const path = require("path");

const url =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "";
const anon =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  "";

const out = path.join(__dirname, "..", "web", "js", "config.js");
const content = `window.DIARIA_CONFIG = {
  supabaseUrl: ${JSON.stringify(url)},
  supabaseAnonKey: ${JSON.stringify(anon)},
};
`;

fs.writeFileSync(out, content, "utf8");
console.log("Wrote", out, url ? "(URL ok)" : "(SUPABASE_URL missing)");

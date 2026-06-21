import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// load .env.local
for (const line of readFileSync(".env.local","utf8").split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g,"");
}
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = "marispetrushko@gmail.com";
const sb = createClient(url, key, { auth: { persistSession:false } });

const { data: found, error: e1 } = await sb
  .from("profiles").select("id,email,plan,display_name").ilike("email", EMAIL);
if (e1) { console.error("SELECT error:", e1.message); process.exit(1); }
if (!found || found.length === 0) {
  console.log(`NOT_FOUND: профиля с email ~ ${EMAIL} нет. Пользователь ещё не зарегистрировался?`);
  process.exit(0);
}
console.log("Найдено:", JSON.stringify(found));
const ids = found.map(r=>r.id);
const { data: upd, error: e2 } = await sb
  .from("profiles").update({ plan: "premium" }).in("id", ids).select("id,email,plan");
if (e2) { console.error("UPDATE error:", e2.message); process.exit(1); }
console.log("Обновлено:", JSON.stringify(upd));

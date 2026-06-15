/**
 * Аудит поля servings: вытащить все рецепты, оценить правдоподобность
 * расчёта "на порцию". One-off, безопасно (только чтение).
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

// грузим .env.local вручную (без dotenv)
const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
for (const line of env.split("\n")) {
  const m = line.match(/^([A-Z_]+)=(.*)$/);
  if (m) process.env[m[1]] ??= m[2];
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const { data, error } = await supabase
  .from("recipes")
  .select("id, slug, title, servings, cook_time, ingredients, nutrition, published")
  .order("created_at", { ascending: true });

if (error) {
  console.error("DB error:", error.message);
  process.exit(1);
}

function flagRecipe(r) {
  const n = r.nutrition;
  const flags = [];
  const servings = r.servings;

  // нет числа порций
  if (!servings || servings <= 0) flags.push("НЕТ числа порций (per_serving = total)");

  if (!n || !n.per_serving) {
    flags.push("НЕТ рассчитанного КБЖУ");
    return { flags, kcalPP: null, weightPP: null, totalW: null, conf: null };
  }

  const kcalPP = n.per_serving.kcal;
  const totalW = n.total?.weight_g ?? null;
  const weightPP = totalW && servings ? Math.round(totalW / servings) : null;
  const conf = n.confidence != null ? Math.round(n.confidence * 100) : null;

  // расхождение: servings в nutrition vs servings в записи
  if (n.servings != null && servings && n.servings !== servings) {
    flags.push(`КБЖУ считалось на ${n.servings} порц., а в рецепте сейчас ${servings} — пересчитать`);
  }

  // правдоподобность ккал на порцию
  if (kcalPP != null) {
    if (kcalPP < 120) flags.push(`Очень мало ккал/порц (${kcalPP}) — порций м.б. слишком много`);
    else if (kcalPP > 1100) flags.push(`Очень много ккал/порц (${kcalPP}) — порций м.б. слишком мало`);
  }

  // правдоподобность веса порции (для блюд, не соусов/масел)
  if (weightPP != null) {
    if (weightPP < 80) flags.push(`Маленькая порция по весу (${weightPP} г) — порций м.б. многовато`);
    else if (weightPP > 700) flags.push(`Большая порция по весу (${weightPP} г) — порций м.б. маловато`);
  }

  // низкая уверенность матчинга
  if (conf != null && conf < 70) flags.push(`Низкая уверенность матчинга (${conf}%)`);

  return { flags, kcalPP, weightPP, totalW, conf };
}

const rows = [];
for (const r of data) {
  const { flags, kcalPP, weightPP, totalW, conf } = flagRecipe(r);
  // число строк состава (грубо)
  const lines = (r.ingredients || "").split("\n").filter((l) => l.trim()).length;
  rows.push({
    title: r.title,
    slug: r.slug,
    published: r.published,
    servings: r.servings,
    cook_time: r.cook_time,
    ingLines: lines,
    totalW,
    weightPP,
    kcalPP,
    conf,
    flags,
  });
}

console.log(`\n=== Всего рецептов: ${data.length} ===\n`);

// сначала — с флагами
const flagged = rows.filter((r) => r.flags.length);
const clean = rows.filter((r) => !r.flags.length);

console.log(`⚑ С пометками: ${flagged.length} | ✓ Чистых: ${clean.length}\n`);
console.log("--- ТРЕБУЮТ ВНИМАНИЯ ---\n");
for (const r of flagged) {
  console.log(`• ${r.title}  [${r.published ? "опубл." : "черновик"}]`);
  console.log(`    порций: ${r.servings ?? "—"} | вес всего: ${r.totalW ?? "—"} г | вес/порц: ${r.weightPP ?? "—"} г | ккал/порц: ${r.kcalPP ?? "—"} | уверенность: ${r.conf ?? "—"}% | строк состава: ${r.ingLines}`);
  for (const f of r.flags) console.log(`    ⚑ ${f}`);
  console.log();
}

console.log("\n--- ВЫГЛЯДЯТ НОРМАЛЬНО ---\n");
for (const r of clean) {
  console.log(`✓ ${r.title} — ${r.servings} порц., ${r.weightPP ?? "—"} г/порц, ${r.kcalPP ?? "—"} ккал/порц (уверенность ${r.conf ?? "—"}%)`);
}

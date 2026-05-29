/**
 * Аудит ingredients_base на точность ±5%.
 *
 * Проверки:
 *   1. Atwater 4P + 9F + 4C ≈ kcal_100g.
 *      Для овощей/фруктов допуск выше (клетчатка не даёт 4 ккал/г).
 *   2. Бенды:
 *      - CLEAN (плотные продукты, |diff| ≤ 5%): идеал, ±5% обещание держится.
 *      - OK (плотные ≤ 15%, овощи/фрукты ≤ 30%): в пределах нормы.
 *      - REVIEW (плотные 15–30%, овощи/фрукты 30–60%): глянуть глазами.
 *      - ALARM (всё, что выше): почти наверняка USDA отдал не тот продукт.
 *   3. Печатает name_en — глазами проверяем, тот ли продукт.
 *
 * Run: node scripts/audit-ingredients.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

let URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (URL && !URL.startsWith("http")) URL = `https://${URL}.supabase.co`;

const s = createClient(URL, KEY);
const { data, error } = await s
  .from("ingredients_base")
  .select("name_ru, name_en, category, kcal_100g, protein_100g, fat_100g, carbs_100g, usda_fdc_id")
  .order("category")
  .order("name_ru");

if (error) { console.error(error); process.exit(1); }

// Атватер: 4P + 9F + 4C
const rows = data.map((r) => {
  const atwater = 4 * (r.protein_100g || 0) + 9 * (r.fat_100g || 0) + 4 * (r.carbs_100g || 0);
  const diff = atwater - (r.kcal_100g || 0);
  const pct = (r.kcal_100g || 0) > 0 ? (diff / r.kcal_100g) * 100 : 0;
  return { ...r, atwater, diff, pct };
});

const FIBER_TOLERANT = new Set(["vegetable", "fruit"]);

function band(r) {
  const abs = Math.abs(r.pct);
  if (FIBER_TOLERANT.has(r.category)) {
    if (abs <= 30) return "OK";
    if (abs <= 60) return "REVIEW";
    return "ALARM";
  }
  if (abs <= 5) return "CLEAN";
  if (abs <= 15) return "OK";
  if (abs <= 30) return "REVIEW";
  return "ALARM";
}

rows.forEach((r) => (r.band = band(r)));

const groups = { ALARM: [], REVIEW: [], OK: [], CLEAN: [] };
for (const r of rows) groups[r.band].push(r);

for (const grp of ["ALARM", "REVIEW", "OK", "CLEAN"]) {
  groups[grp].sort((a, b) => Math.abs(b.pct) - Math.abs(a.pct));
  console.log(`\n=== ${grp} (${groups[grp].length}) ===`);
  for (const r of groups[grp]) {
    const sign = r.diff >= 0 ? "+" : "";
    console.log(
      `[${(r.category || "").padEnd(10)}] ${r.name_ru.padEnd(22)} ` +
        `kcal=${String(r.kcal_100g).padStart(4)} atw=${String(Math.round(r.atwater)).padStart(4)} ` +
        `Δ=${sign}${Math.round(r.diff).toString().padStart(4)} (${r.pct.toFixed(1).padStart(6)}%)  ` +
        `« ${r.name_en}`,
    );
  }
}

console.log(
  `\nTotal: ${rows.length} | CLEAN: ${groups.CLEAN.length} | OK: ${groups.OK.length} | ` +
    `REVIEW: ${groups.REVIEW.length} | ALARM: ${groups.ALARM.length}`,
);

// Подробный дамп макросов отдельно — для проверки «что вообще лежит»
console.log("\n=== FULL DUMP (для глазной проверки name_en ↔ name_ru) ===");
const byCat = {};
for (const r of rows) (byCat[r.category] ||= []).push(r);
for (const cat of Object.keys(byCat).sort()) {
  console.log(`\n## ${cat}`);
  for (const r of byCat[cat]) {
    console.log(
      `  ${r.name_ru.padEnd(22)} P${String(r.protein_100g).padStart(5)} ` +
        `F${String(r.fat_100g).padStart(5)} C${String(r.carbs_100g).padStart(5)} ` +
        `= ${String(r.kcal_100g).padStart(4)} kcal  « ${r.name_en}`,
    );
  }
}

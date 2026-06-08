/**
 * seed-ingredient-duck.mjs — добавляет утку в ingredients_base.
 *
 * Зачем: утки в базе не было, без неё не считается КБЖУ рецепта
 * «Утка с яблоками, черносливом и чесноком».
 *
 * ⚠ Решение по значению "утка" (обсуждено с Дарьей, можно поменять):
 *   Утку практически никогда не едят сырой — это всегда запечённое/обжаренное
 *   блюдо, и при запекании со стороны кожи вытапливается БОЛЬШАЯ часть жира
 *   (ради этого кожу и надрезают крест-накрест). Поэтому для "утка" храним
 *   значение ЗАПЕЧЁННОЙ мякоти с кожей (USDA «meat and skin, roasted» = 337),
 *   а не сырой кожистой (404 ккал, 39 г жира/100 г) — иначе на порцию выходит
 *   ~1300 ккал и 120+ г жира, чего на тарелке нет. Это осознанное отступление
 *   от правила «значения в сыром виде» (см. seed-ingredients.mjs §48) — ровно
 *   для жирной птицы, которую едят только запечённой.
 *   Параллельно кладём "утка без кожи" — честное сырое значение мяса без кожи
 *   (USDA «meat only, raw» = 132) для более постных рецептов в будущем.
 *
 * Запуск: node scripts/seed-ingredient-duck.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

let URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (URL && !URL.startsWith("http")) URL = `https://${URL}.supabase.co`;
if (!URL || !KEY) {
  console.error("✗ Supabase env missing");
  process.exit(1);
}
const s = createClient(URL, KEY);

const ENTRIES = [
  // Запечённая мякоть с кожей — что реально на тарелке (см. шапку файла).
  { name_ru: "утка",            category: "meat", kcal: 337, P: 18.99, F: 28.35, C: 0, name_en: "Duck, domesticated, meat and skin, roasted" },
  // Сырое мясо без кожи — постный вариант для будущих рецептов.
  { name_ru: "утка без кожи",   category: "meat", kcal: 132, P: 18.28, F: 5.95,  C: 0, name_en: "Duck, domesticated, meat only, raw" },
];

async function upsert(e) {
  const row = {
    name_ru: e.name_ru,
    name_en: e.name_en,
    kcal_100g: Number(e.kcal.toFixed(2)),
    protein_100g: Number(e.P.toFixed(2)),
    fat_100g: Number(e.F.toFixed(2)),
    carbs_100g: Number(e.C.toFixed(2)),
    usda_fdc_id: null,
    category: e.category,
  };
  const { error } = await s.from("ingredients_base").upsert(row, { onConflict: "name_ru" });
  return error ? { ok: false, msg: error.message } : { ok: true };
}

async function main() {
  for (const e of ENTRIES) {
    const r = await upsert(e);
    if (r.ok) console.log(`  ✓ ${e.name_ru.padEnd(16)} ${e.kcal} ккал | P${e.P} F${e.F} C${e.C}  « ${e.name_en}`);
    else console.error(`  ✗ ${e.name_ru}: ${r.msg}`);
  }
  console.log("DONE");
}
main().catch((err) => { console.error("FATAL:", err); process.exit(1); });

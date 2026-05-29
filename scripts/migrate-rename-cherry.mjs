/**
 * Миграция: переименовать «вишня» → «черешня» в ingredients_base.
 *
 * Контекст: текущая запись name_ru="вишня" хранит значения USDA "Cherries, sweet, raw",
 * что по факту = черешня. Кислая вишня (sour cherry) — другой продукт с другими макросами.
 * Этот скрипт переименовывает существующую запись, освобождая имя «вишня» для новой
 * записи с правильными значениями sour cherry (добавляется в seed-ingredients-expansion.mjs).
 *
 * Идемпотентен: если «вишня» уже переименована, ничего не делает.
 *
 * Run: node scripts/migrate-rename-cherry.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

let URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (URL && !URL.startsWith("http")) URL = `https://${URL}.supabase.co`;

if (!URL || !KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const s = createClient(URL, KEY);

// 1. Проверим, есть ли уже «черешня» (защита от повторного запуска)
const { data: existing } = await s
  .from("ingredients_base")
  .select("name_ru, name_en, kcal_100g")
  .in("name_ru", ["вишня", "черешня"]);

console.log("Найдено:", existing);

const hasCherry = existing?.some((r) => r.name_ru === "черешня");
const hasVishnya = existing?.some((r) => r.name_ru === "вишня");

if (hasCherry && !hasVishnya) {
  console.log("✓ Уже переименовано: «черешня» есть, «вишня» отсутствует. Ничего не делаю.");
  process.exit(0);
}

if (hasCherry && hasVishnya) {
  console.log("⚠ И «вишня», и «черешня» обе есть — миграция уже была, плюс кто-то вручную добавил «вишня».");
  console.log("  Скрипт не трогает их. Проверь руками.");
  process.exit(0);
}

if (!hasVishnya) {
  console.log("✗ «вишня» не найдена. Странно. Прерываю.");
  process.exit(1);
}

// 2. Переименовать
const { data, error } = await s
  .from("ingredients_base")
  .update({
    name_ru: "черешня",
    name_en: "Cherries, sweet, raw",
  })
  .eq("name_ru", "вишня")
  .select();

if (error) {
  console.error("✗ Ошибка:", error.message);
  process.exit(1);
}

console.log(`✓ Переименовано: ${data?.length ?? 0} строка`);
if (data?.length) {
  console.log("  →", data[0]);
}
console.log("\nДальше: запусти scripts/seed-ingredients-expansion.mjs — он добавит новую «вишня» как sour cherry.");

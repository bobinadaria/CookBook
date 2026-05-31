/**
 * gen-cover-openai.mjs — фолбэк-генератор обложки на OpenAI gpt-image-1
 * (квадрат 1024×1024), когда Imagen 4 Ultra недоступен (например, упёрся в
 * месячный спендкап). Логика повторяет src/lib/cover-image.ts:
 *   1. Строит англоязычный промпт (food / drink).
 *   2. Генерирует через gpt-image-1.
 *   3. Сжимает sharp → WebP@82.
 *   4. Заливает в Supabase Storage (bucket recipe-covers).
 *   5. Если передан --recipe-id, апдейтит recipes.cover_image.
 *
 * Запуск:
 *   node scripts/gen-cover-openai.mjs --title "..." --description "..." \
 *     --ingredients "<RU/EN список>" --recipe-id <uuid> --kind food
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const envPath = join(root, ".env.local");
if (!existsSync(envPath)) { console.error("✗ .env.local missing"); process.exit(1); }
for (const line of readFileSync(envPath, "utf-8").split("\n")) {
  const t = line.trim(); if (!t || t.startsWith("#")) continue;
  const i = t.indexOf("="); if (i === -1) continue;
  if (!process.env[t.slice(0, i).trim()]) process.env[t.slice(0, i).trim()] = t.slice(i + 1).trim();
}

const args = process.argv.slice(2);
let title = "", description = "", recipeId = "", ingredients = "", kind = "food";
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--title" && args[i + 1]) title = args[++i];
  else if (args[i] === "--description" && args[i + 1]) description = args[++i];
  else if (args[i] === "--ingredients" && args[i + 1]) ingredients = args[++i];
  else if (args[i] === "--recipe-id" && args[i + 1]) recipeId = args[++i];
  else if (args[i] === "--kind" && args[i + 1]) kind = args[++i];
}
if (!title) { console.error("✗ --title required"); process.exit(1); }

function buildPrompt(title, type, description, ingredients) {
  const parts = [title];
  if (description) parts.push(description);
  let ing = "";
  if (ingredients) {
    const lines = ingredients.split(/\n|,|;/).map(s => s.replace(/^\s*[-•*\d.]+\s*/, "").trim()).filter(Boolean).slice(0, 6);
    if (lines.length) ing = ` Key visible ingredients: ${lines.join(", ")}.`;
  }
  const context = parts.join(". ");
  if (type === "drink") {
    return `Award-winning editorial beverage photograph of "${context}".${ing} ` +
      `The drink is served in an appropriate glass or cup — accurate color, real liquid, natural condensation or steam, ice or garnish only if it belongs to this drink. ` +
      `NO plate, NO cutlery, NO main dish. Shot on Sony A7R IV with 85mm f/1.8 lens. Natural window light from the left, soft diffused, no harsh studio flash. ` +
      `Angle: slight 20–35 degrees, close crop on the glass. Slightly shallow depth of field. ` +
      `Background: simple dark linen, weathered dark oak wood, or a calm bar counter. Props: ONLY items from the recipe. ` +
      `Looks freshly poured: natural highlights, realistic liquid texture — not CGI. Color grading: warm, slightly desaturated, natural film tones. Subtle grain. No text, no watermarks.`;
  }
  return `Award-winning editorial food photograph of "${context}".${ing} ` +
    `The dish must look exactly as the name implies — accurate textures, real sauce, real food. ` +
    `Shot on Sony A7R IV with 85mm f/1.8 lens. Natural window light from the left, soft diffused, no harsh studio flash. ` +
    `Angle: 40–50 degrees, close crop on the plate. Slightly shallow depth of field — foreground sharp, background softly out of focus. ` +
    `Background: simple dark linen or weathered dark oak wood. Props: ONLY items directly from the recipe — nothing else. No candles, no cinnamon, no random objects. ` +
    `The food looks freshly made: natural imperfections, slight moisture, realistic textures — not CGI, not 3D render, not advertising photo. ` +
    `Color grading: warm, slightly desaturated, natural film tones. Subtle grain. No text, no watermarks.`;
}

const prompt = buildPrompt(title, kind, description, ingredients);
console.log(`🎨 OpenAI gpt-image-1 (1024×1024) — «${title}»`);
console.log(`📝 ${prompt.slice(0, 140)}…\n`);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const r = await openai.images.generate({ model: "gpt-image-1", prompt, n: 1, size: "1024x1024", quality: "medium" });
const b64 = r.data?.[0]?.b64_json;
if (!b64) { console.error("✗ OpenAI вернул пустой ответ"); process.exit(1); }
let buf = Buffer.from(b64, "base64");
console.log(`✅ сгенерировано: ${(buf.length / 1024).toFixed(0)} KB`);

try {
  const { default: sharp } = await import("sharp");
  const before = buf.length;
  buf = await sharp(buf).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer();
  console.log(`🗜️  ${(before / 1024).toFixed(0)} KB → ${(buf.length / 1024).toFixed(0)} KB`);
} catch (e) { console.warn("⚠️  sharp не сработал:", e.message); }

const supa = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const path = `covers/ai-${Date.now()}.webp`;
const up = await supa.storage.from("recipe-covers").upload(path, buf, { contentType: "image/webp", upsert: true });
if (up.error) { console.error("✗ upload:", up.error.message); process.exit(1); }
const url = supa.storage.from("recipe-covers").getPublicUrl(path).data.publicUrl;
console.log("✅ uploaded:", url);

if (recipeId) {
  const upd = await supa.from("recipes").update({ cover_image: url }).eq("id", recipeId);
  if (upd.error) { console.error("✗ update recipe:", upd.error.message); process.exit(1); }
  console.log("✅ recipe.cover_image updated");
}
console.log("\n🎉 done.");

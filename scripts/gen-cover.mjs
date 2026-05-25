#!/usr/bin/env node
/**
 * gen-cover.mjs — AI cover image generator for Cookbook recipes
 *
 * Usage:
 *   node scripts/gen-cover.mjs --title "Паста карбонара"
 *   node scripts/gen-cover.mjs --title "Тарт с инжиром" --description "Нежный тарт с рикоттой"
 *   node scripts/gen-cover.mjs --title "Борщ" --recipe-id "uuid-of-recipe"
 *
 * Options:
 *   --title         Recipe title (required)
 *   --description   Short description to improve image accuracy (optional)
 *   --recipe-id     If provided, updates the cover_image field in Supabase (optional)
 *
 * Requires in .env.local:
 *   GOOGLE_AI_API_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

// ── Resolve project root ──────────────────────────────────────────────────────

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

// ── Load .env.local ───────────────────────────────────────────────────────────

function loadEnv() {
  const envPath = join(projectRoot, ".env.local");
  if (!existsSync(envPath)) {
    console.error("❌  .env.local not found. Run from project root.");
    process.exit(1);
  }
  const lines = readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
}

// ── Parse CLI args ────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);
  const result = { title: "", description: "", recipeId: "" };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--title" && args[i + 1]) result.title = args[++i];
    else if (args[i] === "--description" && args[i + 1]) result.description = args[++i];
    else if (args[i] === "--recipe-id" && args[i + 1]) result.recipeId = args[++i];
  }
  return result;
}

// ── Build image prompt ────────────────────────────────────────────────────────

function buildPrompt(title, description) {
  const subject = description ? `${title} — ${description}` : title;
  return (
    `Food photography of ${subject}. ` +
    `Top-down view (flat lay), warm natural light from above, ` +
    `rustic wooden surface, soft diffused shadows, small natural props (herbs, linen napkin). ` +
    `Appetizing and cozy home-kitchen aesthetic, film photography feel, ` +
    `muted warm tones (cream, sand, peach), shallow depth of field. ` +
    `High-end editorial food magazine style. No text, no watermarks.`
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  loadEnv();

  const { title, description, recipeId } = parseArgs();

  if (!title) {
    console.error("❌  --title is required\n");
    console.error("Usage: node scripts/gen-cover.mjs --title \"Название рецепта\"");
    process.exit(1);
  }

  const googleKey = process.env.GOOGLE_AI_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!googleKey) {
    console.error("❌  GOOGLE_AI_API_KEY не настроен в .env.local");
    process.exit(1);
  }
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌  NEXT_PUBLIC_SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY не настроены");
    process.exit(1);
  }

  // 1. Generate image (Imagen 4 Ultra, формат 1:1 — квадрат, единый для всех рецептов)
  console.log(`\n🎨  Генерирую обложку для «${title}» (Imagen 4 Ultra)…`);
  const prompt = buildPrompt(title, description);
  console.log(`📝  Промпт: ${prompt.slice(0, 100)}…\n`);

  let imageBuffer;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-ultra-generate-001:predict?key=${googleKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1, aspectRatio: "1:1", personGeneration: "dont_allow" },
        }),
      },
    );
    if (!res.ok) throw new Error(`Imagen ${res.status}: ${(await res.text()).slice(0, 200)}`);
    const data = await res.json();
    const b64 =
      data.predictions?.[0]?.bytesBase64Encoded ?? data.predictions?.[0]?.image?.bytesBase64Encoded;
    if (!b64) throw new Error("Imagen вернул пустой ответ");
    imageBuffer = Buffer.from(b64, "base64");
    console.log(`✅  Изображение сгенерировано (${(imageBuffer.length / 1024).toFixed(0)} KB)`);
  } catch (err) {
    console.error("❌  Ошибка Imagen:", err.message);
    process.exit(1);
  }

  // 2.5. Compress: resize до 1600w + WebP@82 — экономит 90% размера без видимой
  //      потери качества. Без этого Vercel image optimizer вынужден каждый раз
  //      качать тяжёлый оригинал и пережимать его сам.
  try {
    const { default: sharp } = await import("sharp");
    const before = imageBuffer.length;
    imageBuffer = await sharp(imageBuffer)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    console.log(
      `🗜️   Сжато: ${(before / 1024).toFixed(0)} KB → ${(imageBuffer.length / 1024).toFixed(0)} KB`,
    );
  } catch (err) {
    console.warn(`⚠️   Не удалось сжать (${err.message}) — заливаю оригинал`);
  }

  // 3. Upload to Supabase Storage
  // Use timestamp-only name — Supabase Storage rejects Cyrillic characters in paths
  const fileName = `ai-${Date.now()}.webp`;
  const storagePath = `covers/${fileName}`;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  console.log("⬆️   Загружаю в Supabase Storage…");
  const { error: uploadError } = await supabase.storage
    .from("recipe-covers")
    .upload(storagePath, imageBuffer, { contentType: "image/webp", upsert: true });

  if (uploadError) {
    console.error("❌  Ошибка загрузки:", uploadError.message);
    process.exit(1);
  }

  const { data: urlData } = supabase.storage.from("recipe-covers").getPublicUrl(storagePath);
  const publicUrl = urlData.publicUrl;
  console.log("✅  Загружено:", publicUrl);

  // 4. Optionally update recipe record
  if (recipeId) {
    console.log(`\n🔗  Обновляю рецепт ${recipeId}…`);
    const { error: updateError } = await supabase
      .from("recipes")
      .update({ cover_image: publicUrl })
      .eq("id", recipeId);

    if (updateError) {
      console.error("❌  Ошибка обновления рецепта:", updateError.message);
    } else {
      console.log("✅  cover_image рецепта обновлён");
    }
  }

  console.log("\n🎉  Готово!");
  console.log("   URL:", publicUrl);
  if (!recipeId) {
    console.log("   Совет: добавь --recipe-id <uuid> чтобы сразу обновить рецепт в базе");
  }
}

main().catch((err) => {
  console.error("Unexpected error:", err);
  process.exit(1);
});

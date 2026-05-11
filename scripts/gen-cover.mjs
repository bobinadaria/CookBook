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
 *   OPENAI_API_KEY
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

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

// ── Build DALL-E 3 prompt ─────────────────────────────────────────────────────

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

  const openaiKey = process.env.OPENAI_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!openaiKey || openaiKey === "YOUR_OPENAI_API_KEY_HERE") {
    console.error("❌  OPENAI_API_KEY не настроен в .env.local");
    process.exit(1);
  }
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("❌  NEXT_PUBLIC_SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY не настроены");
    process.exit(1);
  }

  // 1. Generate image
  console.log(`\n🎨  Генерирую обложку для «${title}»…`);
  const prompt = buildPrompt(title, description);
  console.log(`📝  Промпт: ${prompt.slice(0, 100)}…\n`);

  const openai = new OpenAI({ apiKey: openaiKey });
  let tempUrl;
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1792x1024",
      quality: "standard",
      response_format: "url",
    });
    tempUrl = response.data[0]?.url;
    if (!tempUrl) throw new Error("OpenAI вернул пустой URL");
    console.log("✅  Изображение сгенерировано");
  } catch (err) {
    console.error("❌  Ошибка OpenAI:", err.message);
    process.exit(1);
  }

  // 2. Download image
  console.log("⬇️   Скачиваю изображение…");
  let imageBuffer;
  try {
    const res = await fetch(tempUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    imageBuffer = Buffer.from(await res.arrayBuffer());
    console.log(`✅  Скачано (${(imageBuffer.length / 1024).toFixed(0)} KB)`);
  } catch (err) {
    console.error("❌  Ошибка скачивания:", err.message);
    process.exit(1);
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

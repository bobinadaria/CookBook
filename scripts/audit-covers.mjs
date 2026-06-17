#!/usr/bin/env node
/**
 * audit-covers.mjs — единая проверка и починка обложек всех рецептов.
 *
 * Проходит по ВСЕМ рецептам в базе и для каждого определяет статус обложки:
 *   • НЕТ ОБЛОЖКИ   — cover_image пустой → нужно сгенерировать
 *   • НЕСЖАТА       — файл в Storage тяжёлый (>500KB) или не WebP → нужно сжать
 *   • ОК            — обложка есть и уже лёгкая
 *
 * Два режима:
 *   node scripts/audit-covers.mjs            # ПРОВЕРКА (dry-run): только покажет таблицу,
 *                                            #   ничего не меняет, Imagen не дёргает
 *   node scripts/audit-covers.mjs --apply    # ПОЧИНКА: сгенерит недостающие обложки
 *                                            #   (Imagen 4 Ultra) + сожмёт несжатые
 *
 * Полезные флаги:
 *   --only-missing    только генерировать недостающие (не трогать сжатие)
 *   --only-compress   только сжимать (не генерировать новые)
 *   --slug <slug>     ограничиться одним рецептом (для повторов/ретраев)
 *
 * Требует в .env.local: GOOGLE_AI_API_KEY, NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *
 * Стиль обложки и сжатие — те же, что в gen-cover.mjs / compress-covers.mjs
 * (Imagen 4 Ultra, 1:1 квадрат; resize 1600w + WebP@82).
 */

import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, "..");

// ── .env.local ────────────────────────────────────────────────────────────────
function loadEnv() {
  const envPath = join(projectRoot, ".env.local");
  if (!existsSync(envPath)) {
    console.error("❌  .env.local не найден. Запускай из корня проекта.");
    process.exit(1);
  }
  for (const line of readFileSync(envPath, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const k = t.slice(0, i).trim();
    const v = t.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

// ── Флаги ───────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const apply = argv.includes("--apply");
const onlyMissing = argv.includes("--only-missing");
const onlyCompress = argv.includes("--only-compress");
const slugIdx = argv.indexOf("--slug");
const onlySlug = slugIdx !== -1 ? argv[slugIdx + 1] : null;

// ── Параметры сжатия (как в compress-covers.mjs) ──────────────────────────────
const MAX_WIDTH = 1600;
const QUALITY = 82;
const SKIP_THRESHOLD = 500_000; // <500KB считаем уже сжатым

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtBytes(n) {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)}KB`;
  return `${(n / 1024 / 1024).toFixed(2)}MB`;
}

function parseStoragePath(publicUrl) {
  const m = publicUrl.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  return m ? { bucket: m[1], path: m[2] } : null;
}

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

let sharp;
async function getSharp() {
  if (!sharp) ({ default: sharp } = await import("sharp"));
  return sharp;
}

async function compressBuffer(buf) {
  const s = await getSharp();
  return s(buf)
    .rotate()
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toBuffer();
}

// Генерация обложки через Imagen 4 Ultra (1:1), затем сжатие
async function generateCover(googleKey, title, description) {
  const prompt = buildPrompt(title, description);
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
  if (!res.ok) throw new Error(`Imagen ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const data = await res.json();
  const b64 =
    data.predictions?.[0]?.bytesBase64Encoded ?? data.predictions?.[0]?.image?.bytesBase64Encoded;
  if (!b64) throw new Error("Imagen вернул пустой ответ (вероятно, Google spend-cap)");
  let buf = Buffer.from(b64, "base64");
  try {
    buf = await compressBuffer(buf);
  } catch (e) {
    console.warn(`    ⚠️  не удалось сжать (${e.message}) — заливаю как есть`);
  }
  return buf;
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  loadEnv();
  const googleKey = process.env.GOOGLE_AI_API_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error("❌  NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY не настроены");
    process.exit(1);
  }
  const supabase = createClient(url, key);

  console.log(`\nРежим: ${apply ? "ПОЧИНКА (--apply)" : "ПРОВЕРКА (dry-run, ничего не меняю)"}`);
  if (onlySlug) console.log(`Фильтр: только slug = ${onlySlug}`);
  if (onlyMissing) console.log("Фильтр: только недостающие обложки");
  if (onlyCompress) console.log("Фильтр: только сжатие");
  console.log("");

  let q = supabase
    .from("recipes")
    .select("id, slug, title, description, recipe_type, cover_image")
    .order("created_at", { ascending: true });
  if (onlySlug) q = q.eq("slug", onlySlug);
  const { data: recipes, error } = await q;
  if (error) throw error;

  console.log(`Всего рецептов: ${recipes.length}\n`);
  console.log("  Статус        Рецепт");
  console.log("  ────────────  ─────────────────────────────────────────────");

  const missing = [];
  const uncompressed = [];
  let ok = 0;

  for (const r of recipes) {
    // Нет обложки
    if (!r.cover_image) {
      console.log(`  🎨 НЕТ        ${r.slug}`);
      missing.push(r);
      continue;
    }
    // Есть — проверяем вес/формат
    const parsed = parseStoragePath(r.cover_image);
    if (!parsed) {
      console.log(`  ⊘ ВНЕШНЯЯ     ${r.slug} (URL не из Storage — пропускаю)`);
      ok++;
      continue;
    }
    try {
      const { data, error: dErr } = await supabase.storage
        .from(parsed.bucket)
        .download(parsed.path);
      if (dErr) throw new Error(dErr.message);
      const buf = Buffer.from(await data.arrayBuffer());
      const isWebp = /\.webp$/i.test(parsed.path);
      if (buf.length > SKIP_THRESHOLD || !isWebp) {
        console.log(`  🗜  НЕСЖАТА    ${r.slug.padEnd(42)} ${fmtBytes(buf.length)}${isWebp ? "" : " (не webp)"}`);
        uncompressed.push({ r, parsed, size: buf.length, buf });
      } else {
        console.log(`  ✓ ОК          ${r.slug.padEnd(42)} ${fmtBytes(buf.length)}`);
        ok++;
      }
    } catch (e) {
      console.log(`  ✗ ОШИБКА      ${r.slug} — ${e.message}`);
    }
  }

  console.log(
    `\nИтог проверки: ✓ ${ok} ок · 🎨 ${missing.length} без обложки · 🗜 ${uncompressed.length} несжатых\n`,
  );

  if (!apply) {
    if (missing.length || uncompressed.length) {
      console.log("Чтобы починить — запусти ещё раз с --apply.");
      if (missing.length && !googleKey)
        console.log("⚠️  Для генерации недостающих нужен GOOGLE_AI_API_KEY в .env.local.");
    } else {
      console.log("🎉  Все обложки на месте и сжаты — ничего делать не нужно.");
    }
    return;
  }

  // ── APPLY ───────────────────────────────────────────────────────────────────
  // 1) Генерация недостающих
  if (!onlyCompress && missing.length) {
    if (!googleKey) {
      console.error("❌  GOOGLE_AI_API_KEY не настроен — не могу генерировать. Пропускаю генерацию.");
    } else {
      console.log(`\n🎨  Генерирую ${missing.length} обложек…\n`);
      for (const r of missing) {
        try {
          console.log(`  • ${r.slug} …`);
          const buf = await generateCover(googleKey, r.title, r.description);
          const path = `covers/ai-${Date.now()}.webp`;
          const { error: upErr } = await supabase.storage
            .from("recipe-covers")
            .upload(path, buf, { contentType: "image/webp", upsert: true });
          if (upErr) throw new Error(upErr.message);
          const { data: pub } = supabase.storage.from("recipe-covers").getPublicUrl(path);
          const { error: updErr } = await supabase
            .from("recipes")
            .update({ cover_image: pub.publicUrl })
            .eq("id", r.id);
          if (updErr) throw new Error(updErr.message);
          console.log(`    ✅  готово (${fmtBytes(buf.length)})`);
        } catch (e) {
          console.log(`    ✗ не вышло: ${e.message}`);
        }
      }
    }
  }

  // 2) Сжатие несжатых (буфер уже скачан на этапе проверки)
  if (!onlyMissing && uncompressed.length) {
    console.log(`\n🗜  Сжимаю ${uncompressed.length} обложек…\n`);
    for (const { r, parsed, size, buf } of uncompressed) {
      try {
        const compressed = await compressBuffer(buf);
        const { error: upErr } = await supabase.storage
          .from(parsed.bucket)
          .upload(parsed.path, compressed, { contentType: "image/webp", upsert: true });
        if (upErr) throw new Error(upErr.message);
        const pct = (((size - compressed.length) / size) * 100).toFixed(0);
        console.log(`  ✦ ${r.slug.padEnd(42)} ${fmtBytes(size)} → ${fmtBytes(compressed.length)} (-${pct}%)`);
      } catch (e) {
        console.log(`  ✗ ${r.slug} — ${e.message}`);
      }
    }
  }

  console.log("\n✓ Готово. Перезайди на сайт и обнови страницу — обложки на месте.\n");
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});

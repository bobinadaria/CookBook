/**
 * Пакетное сжатие всех cover_image-ов в Supabase Storage.
 *
 * Контекст: Midjourney/AI обычно отдают 2-4MB cover'ы. next/image на Vercel
 * вынужден каждый раз скачивать и пережимать оригинал в первый запрос → медленно.
 * После этого скрипта cover'ы будут ~200-400KB WebP, qquality 82 — визуально
 * неотличимо, но грузится в 10× быстрее.
 *
 * Idempotent: если файл уже маленький (<500KB) или уже WebP с good quality —
 * пропускаем. Можно перезапускать сколько угодно.
 *
 * Принцип: скачиваем из bucket `recipe-covers`, сжимаем sharp'ом,
 * перезаливаем НА ТОТ ЖЕ путь (upsert) — URL в БД не меняется.
 *
 * Run: node scripts/compress-covers.mjs           # dry-run, только посчитает
 *      node scripts/compress-covers.mjs --apply   # реально перезаписать
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";
import sharp from "sharp";

config({ path: resolve(".env.local") });

const apply = process.argv.includes("--apply");

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("✗ NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

// ── Параметры сжатия ────────────────────────────────────────────────────────
const MAX_WIDTH = 1600;        // обложки рецептов отображаются max ~1200px (sm:50vw)
const QUALITY = 82;             // визуально неотличимо от 95+
const SKIP_THRESHOLD = 500_000; // если файл уже <500KB — не трогаем
const TARGET_FORMAT = "webp";   // лучшее соотношение качество/размер для фото

// ── Helpers ─────────────────────────────────────────────────────────────────

function fmtBytes(n) {
  if (n < 1024) return `${n}B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)}KB`;
  return `${(n / 1024 / 1024).toFixed(2)}MB`;
}

/** Извлекает путь внутри bucket'а из public URL */
function parseStoragePath(publicUrl) {
  const m = publicUrl.match(/\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/);
  return m ? { bucket: m[1], path: m[2] } : null;
}

async function downloadFile(bucket, path) {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error) throw new Error(`download failed: ${error.message}`);
  return Buffer.from(await data.arrayBuffer());
}

async function uploadFile(bucket, path, buffer, contentType) {
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { contentType, upsert: true });
  if (error) throw new Error(`upload failed: ${error.message}`);
}

async function compressBuffer(buf) {
  return sharp(buf)
    .rotate() // honor EXIF orientation
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toBuffer();
}

// ── Main ────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nMode: ${apply ? "APPLY (перезапись будет)" : "DRY-RUN (только подсчёт)"}\n`);

  // 1. Собираем все recipes с cover_image
  const { data: recipes, error } = await supabase
    .from("recipes")
    .select("id, slug, cover_image")
    .not("cover_image", "is", null);

  if (error) throw error;

  console.log(`Найдено рецептов с обложкой: ${recipes.length}\n`);

  let totalOriginal = 0;
  let totalCompressed = 0;
  let processed = 0;
  let skipped = 0;
  let failed = 0;

  for (const r of recipes) {
    const parsed = parseStoragePath(r.cover_image);
    if (!parsed) {
      console.log(`  ⊘ ${r.slug.padEnd(50)} — URL не из Supabase Storage, пропускаю`);
      continue;
    }
    const { bucket, path } = parsed;

    try {
      // Скачиваем
      const original = await downloadFile(bucket, path);
      totalOriginal += original.length;

      // Skip если уже маленький
      if (original.length < SKIP_THRESHOLD) {
        console.log(
          `  ✓ ${r.slug.padEnd(50)} ${fmtBytes(original.length).padStart(8)} (уже ок, skip)`,
        );
        totalCompressed += original.length;
        skipped++;
        continue;
      }

      // Сжимаем
      const compressed = await compressBuffer(original);
      totalCompressed += compressed.length;
      const saved = original.length - compressed.length;
      const savedPct = (saved / original.length) * 100;

      const arrow = apply ? "→" : "≈";
      console.log(
        `  ✦ ${r.slug.padEnd(50)} ${fmtBytes(original.length).padStart(8)} ${arrow} ${fmtBytes(compressed.length).padStart(8)} ` +
          `(-${savedPct.toFixed(0)}%)`,
      );

      // Заливаем обратно (только в --apply режиме)
      if (apply) {
        await uploadFile(bucket, path, compressed, "image/webp");
      }
      processed++;
    } catch (err) {
      console.log(`  ✗ ${r.slug.padEnd(50)} — ${err.message}`);
      failed++;
    }
  }

  console.log(
    `\nИтого: ${processed} пережаты, ${skipped} пропущены, ${failed} ошибок`,
  );
  console.log(`Общий размер: ${fmtBytes(totalOriginal)} → ${fmtBytes(totalCompressed)}`);
  if (totalOriginal > 0) {
    const savedPct = ((totalOriginal - totalCompressed) / totalOriginal) * 100;
    console.log(`Экономия: ${fmtBytes(totalOriginal - totalCompressed)} (-${savedPct.toFixed(0)}%)`);
  }
  if (!apply) {
    console.log(`\nЭто был DRY-RUN. Если цифры устраивают — запусти с --apply\n`);
  } else {
    console.log(`\n✓ Готово. Перезайди на сайт и обнови страницу — увидишь разницу.\n`);
  }
}

main().catch((err) => {
  console.error("FATAL:", err);
  process.exit(1);
});

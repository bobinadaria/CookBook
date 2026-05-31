/**
 * Общая логика генерации квадратной обложки рецепта (Imagen 4 Ultra → gpt-image-1 фолбэк).
 *
 * Используется двумя роутами:
 *   - `/api/admin/generate-image` — для админ-формы (full power, может подтягивать
 *     EN-переводы из БД по recipeId);
 *   - `/api/recipes/generate-image` — для юзер-формы (premium/lifetime), работает
 *     только с тем, что пришло в теле запроса — без обращения к чужим рецептам.
 *
 * Здесь только промпт + вызовы моделей + sharp-сжатие + загрузка в Storage.
 * Аутентификация и проверка прав — задача роутов.
 */
import OpenAI from "openai";
import { createServiceRoleClient } from "@/lib/supabase/admin";

export type RecipeKind = "food" | "drink";

/**
 * Строит англоязычный промпт для генератора обложек.
 * Английский даёт лучший результат на еде; русский передавать не стоит.
 */
export function buildCoverPrompt(
  title: string,
  type: RecipeKind,
  description?: string,
  ingredients?: string,
): string {
  const parts: string[] = [title];
  if (description) parts.push(description);

  // Подсказка по ключевым ингредиентам — модель точнее рисует именно этот рецепт.
  let ingredientHint = "";
  if (ingredients) {
    const lines = ingredients
      .split(/\n|,|;/)
      .map((s) => s.replace(/^\s*[-•*\d.]+\s*/, "").trim())
      .filter(Boolean)
      .slice(0, 6);
    if (lines.length) {
      ingredientHint = ` Key visible ingredients: ${lines.join(", ")}.`;
    }
  }

  const context = parts.join(". ");

  if (type === "drink") {
    return (
      `Award-winning editorial beverage photograph of "${context}".${ingredientHint} ` +
      `The drink is served in an appropriate glass or cup for this kind of beverage (cocktail, coffee, tea, lemonade, smoothie, etc.) — ` +
      `accurate color, real liquid, natural condensation or steam, ice or garnish only if it belongs to this drink. ` +
      `NO plate, NO cutlery, NO main dish — this is a drink, not food on a plate. ` +
      `Shot on Sony A7R IV with 85mm f/1.8 lens. Natural window light from the left, soft diffused, no harsh studio flash. ` +
      `Angle: slight 20–35 degrees, close crop on the glass. Slightly shallow depth of field — glass sharp, background softly out of focus. ` +
      `Background: simple dark linen, weathered dark oak wood, or a calm bar counter. ` +
      `Props: ONLY items directly from the recipe — nothing else. No random objects. ` +
      `Looks freshly poured: natural highlights, realistic liquid texture — not CGI, not 3D render, not advertising photo. ` +
      `Color grading: warm, slightly desaturated, natural film tones. Subtle grain. ` +
      `No text, no watermarks.`
    );
  }

  return (
    `Award-winning editorial food photograph of "${context}".${ingredientHint} ` +
    `The dish must look exactly as the name implies — accurate textures, real sauce, real food. ` +
    `Shot on Sony A7R IV with 85mm f/1.8 lens. Natural window light from the left, soft diffused, no harsh studio flash. ` +
    `Angle: 40–50 degrees, close crop on the plate. Slightly shallow depth of field — foreground sharp, background softly out of focus. ` +
    `Background: simple dark linen or weathered dark oak wood. ` +
    `Props: ONLY items directly from the recipe — nothing else. No candles, no cinnamon, no random objects. ` +
    `The food looks freshly made: natural imperfections, slight moisture, realistic textures — not CGI, not 3D render, not advertising photo. ` +
    `Color grading: warm, slightly desaturated, natural film tones. Subtle grain. ` +
    `No text, no watermarks.`
  );
}

/** Imagen 4 Ultra (Google AI) — основная модель, квадрат 1:1. */
async function generateWithImagen(prompt: string): Promise<Buffer> {
  const googleKey = process.env.GOOGLE_AI_API_KEY;
  if (!googleKey) throw new Error("GOOGLE_AI_API_KEY не настроен в .env.local");
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
  if (!res.ok) throw new Error(`Imagen ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = (await res.json()) as {
    predictions?: { bytesBase64Encoded?: string; image?: { bytesBase64Encoded?: string } }[];
  };
  const b64 =
    data.predictions?.[0]?.bytesBase64Encoded ?? data.predictions?.[0]?.image?.bytesBase64Encoded;
  if (!b64) throw new Error("Imagen вернул пустой ответ");
  return Buffer.from(b64, "base64");
}

/** gpt-image-1 (OpenAI) — фолбэк, тоже квадрат. */
async function generateWithGptImage(prompt: string): Promise<Buffer> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey || openaiKey === "YOUR_OPENAI_API_KEY_HERE")
    throw new Error("OPENAI_API_KEY не настроен");
  const openai = new OpenAI({ apiKey: openaiKey });
  const response = await openai.images.generate({
    model: "gpt-image-1",
    prompt,
    n: 1,
    size: "1024x1024",
    quality: "medium",
  });
  const b64 = response.data?.[0]?.b64_json;
  if (!b64) throw new Error("OpenAI вернул пустой ответ");
  return Buffer.from(b64, "base64");
}

export interface CoverGenerationResult {
  buffer: Buffer;
  model: "imagen-4.0-ultra" | "gpt-image-1";
}

/**
 * Генерирует обложку: Imagen → фолбэк gpt-image-1. Бросает Error, если оба упали.
 */
export async function generateCoverImage(prompt: string): Promise<CoverGenerationResult> {
  try {
    const buffer = await generateWithImagen(prompt);
    return { buffer, model: "imagen-4.0-ultra" };
  } catch (imagenErr) {
    console.warn(
      "[cover-image] Imagen 4 Ultra failed, fallback → gpt-image-1:",
      imagenErr,
    );
    try {
      const buffer = await generateWithGptImage(prompt);
      return { buffer, model: "gpt-image-1" };
    } catch (openaiErr) {
      const m1 = imagenErr instanceof Error ? imagenErr.message : String(imagenErr);
      const m2 = openaiErr instanceof Error ? openaiErr.message : String(openaiErr);
      console.error("[cover-image] оба генератора упали:", m1, "|", m2);
      throw new Error(m1);
    }
  }
}

/**
 * Сжимает (resize 1600w + WebP@82) и загружает обложку в Supabase Storage
 * (`recipe-covers/covers/ai-<ts>.webp`). Возвращает публичный URL.
 *
 * Имя файла — только timestamp, без юзерских данных (Supabase Storage не любит
 * кириллицу в путях, а смешивать публичный bucket с user-id небезопасно).
 */
export async function uploadCoverToStorage(buffer: Buffer): Promise<{ url: string; path: string }> {
  let finalBuffer = buffer;
  try {
    const sharpModule = await import("sharp");
    const sharp = sharpModule.default;
    const before = buffer.length;
    finalBuffer = await sharp(buffer)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    console.log(
      `[cover-image] compressed: ${(before / 1024).toFixed(0)}KB → ${(finalBuffer.length / 1024).toFixed(0)}KB`,
    );
  } catch (err) {
    console.warn("[cover-image] sharp compress failed, uploading original:", err);
  }

  const fileName = `ai-${Date.now()}.webp`;
  const storagePath = `covers/${fileName}`;

  const supabaseAdmin = createServiceRoleClient();
  const { error: uploadError } = await supabaseAdmin.storage
    .from("recipe-covers")
    .upload(storagePath, finalBuffer, {
      contentType: "image/webp",
      upsert: true,
    });

  if (uploadError) {
    console.error("[cover-image] Storage upload error:", uploadError);
    throw new Error(`Ошибка загрузки: ${uploadError.message}`);
  }

  const { data: publicUrlData } = supabaseAdmin.storage
    .from("recipe-covers")
    .getPublicUrl(storagePath);

  return { url: publicUrlData.publicUrl, path: storagePath };
}

import { createServiceRoleClient, isValidUUID } from "@/lib/supabase/admin";
import { requireAdmin, isAuthSuccess } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// Генерация изображения может занимать до ~60с
export const maxDuration = 60;

/**
 * Builds an image-generation prompt (Imagen 4 / gpt-image-1) based on the recipe content.
 * Always in English for best results — uses EN translations when available,
 * falls back to the original (Russian) text.
 *
 * Для напитков (`type === "drink"`) сцена другая: напиток в подходящем бокале/
 * стакане, без тарелки и столовых приборов — иначе генератор рисует «блюдо на
 * тарелке» вместо коктейля.
 */
function buildPrompt(
  title: string,
  type: "food" | "drink",
  description?: string,
  ingredients?: string,
): string {
  const parts: string[] = [title];
  if (description) parts.push(description);

  // Extract key ingredients so the model renders the recipe accurately
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

export async function POST(req: NextRequest) {
  // 1. Verify admin auth (replaces inline user + isAdmin checks)
  const auth = await requireAdmin();
  if (!isAuthSuccess(auth)) return auth;

  // 2. Parse + validate request body
  const body = await req.json().catch(() => ({}));
  const { title, description, ingredients, recipeId, recipeType } = body as {
    title?: string;
    description?: string;
    ingredients?: string;
    recipeId?: string;
    recipeType?: "food" | "drink";
  };

  if (!title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  // 4. If recipeId provided, fetch English translations from Supabase
  //    and prefer them over the Russian originals for a better prompt.
  let promptTitle = title.trim();
  let promptDescription = description?.trim();
  let promptIngredients = ingredients?.trim();
  // Тип берём из тела (форма передаёт текущий выбор). Если есть recipeId —
  // тип из БД авторитетнее (на случай рассинхрона). По умолчанию «food».
  let promptType: "food" | "drink" = recipeType === "drink" ? "drink" : "food";

  if (recipeId && isValidUUID(recipeId)) {
    const supabaseAdmin = createServiceRoleClient();
    const { data: recipe } = await supabaseAdmin
      .from("recipes")
      .select("title_en, description_en, ingredients_en, recipe_type")
      .eq("id", recipeId)
      .single();

    if (recipe) {
      // Use English fields when available — they produce better DALL-E results
      if (recipe.title_en)       promptTitle       = recipe.title_en;
      if (recipe.description_en) promptDescription = recipe.description_en;
      if (recipe.ingredients_en) promptIngredients = recipe.ingredients_en;
      if (recipe.recipe_type === "drink" || recipe.recipe_type === "food") {
        promptType = recipe.recipe_type;
      }
    }
  }

  // 5. Generate image.
  //    Основная модель — Imagen 4 Ultra (Google): заметно фотореалистичнее на еде.
  //    Фолбэк — gpt-image-1 (OpenAI), если Imagen вернул ошибку, чтобы кнопка не «умирала».
  const googleKey = process.env.GOOGLE_AI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const prompt = buildPrompt(promptTitle, promptType, promptDescription, promptIngredients);

  // Imagen 4 Ultra через Google AI API (тот же ключ, что и автоперевод).
  // Формат 1:1 — квадратная обложка, единый формат для всех рецептов.
  async function generateWithImagen(): Promise<Buffer> {
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

  // Фолбэк: gpt-image-1, квадрат.
  async function generateWithGptImage(): Promise<Buffer> {
    if (!openaiKey || openaiKey === "YOUR_OPENAI_API_KEY_HERE")
      throw new Error("OPENAI_API_KEY не настроен");
    const openai = new OpenAI({ apiKey: openaiKey });
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: "1024x1024", // квадрат
      quality: "medium",
    });
    const b64 = response.data?.[0]?.b64_json;
    if (!b64) throw new Error("OpenAI вернул пустой ответ");
    return Buffer.from(b64, "base64");
  }

  let imageBuffer: Buffer;
  let modelUsed = "imagen-4.0-ultra";

  try {
    imageBuffer = await generateWithImagen();
  } catch (imagenErr) {
    console.warn("[generate-image] Imagen 4 Ultra failed, fallback → gpt-image-1:", imagenErr);
    try {
      imageBuffer = await generateWithGptImage();
      modelUsed = "gpt-image-1";
    } catch (openaiErr) {
      const m1 = imagenErr instanceof Error ? imagenErr.message : String(imagenErr);
      const m2 = openaiErr instanceof Error ? openaiErr.message : String(openaiErr);
      console.error("[generate-image] оба генератора упали:", m1, "|", m2);
      return NextResponse.json({ error: `Ошибка генерации: ${m1}` }, { status: 500 });
    }
  }

  // 8. Compress before upload — resize до 1600w + WebP@82.
  //    Без этого Vercel image-optimizer вынужден каждый раз качать оригинал из
  //    Supabase Storage и пережимать сам (медленно).
  try {
    const sharpModule = await import("sharp");
    const sharp = sharpModule.default;
    const before = imageBuffer.length;
    imageBuffer = await sharp(imageBuffer)
      .rotate()
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();
    console.log(
      `[generate-image] compressed: ${(before / 1024).toFixed(0)}KB → ${(imageBuffer.length / 1024).toFixed(0)}KB`,
    );
  } catch (err) {
    console.warn("[generate-image] sharp compress failed, uploading original:", err);
  }

  // 9. Upload to Supabase Storage
  // Timestamp-only name — Supabase Storage rejects Cyrillic characters in paths
  const fileName = `ai-${Date.now()}.webp`;
  const storagePath = `covers/${fileName}`;

  const supabaseAdmin = createServiceRoleClient();
  const { error: uploadError } = await supabaseAdmin.storage
    .from("recipe-covers")
    .upload(storagePath, imageBuffer, {
      contentType: "image/webp",
      upsert: true,
    });

  if (uploadError) {
    console.error("[generate-image] Storage upload error:", uploadError);
    return NextResponse.json({ error: `Ошибка загрузки: ${uploadError.message}` }, { status: 500 });
  }

  // 9. Get the public URL
  const { data: publicUrlData } = supabaseAdmin.storage
    .from("recipe-covers")
    .getPublicUrl(storagePath);

  return NextResponse.json({
    url: publicUrlData.publicUrl,
    path: storagePath,
    prompt, // useful for debugging
    model: modelUsed,
    usedEnglish: promptTitle !== title.trim(), // tells the client whether EN fields were used
  });
}

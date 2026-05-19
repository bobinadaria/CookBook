import { createServiceRoleClient, isValidUUID } from "@/lib/supabase/admin";
import { requireAdmin, isAuthSuccess } from "@/lib/api-auth";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// DALL-E 3 can take up to 60s on slower prompts
export const maxDuration = 60;

/**
 * Builds a DALL-E 3 prompt based on the actual recipe content.
 * Always in English for best results — uses EN translations when available,
 * falls back to the original (Russian) text.
 */
function buildPrompt(title: string, description?: string, ingredients?: string): string {
  const parts: string[] = [title];
  if (description) parts.push(description);

  // Extract key ingredients so DALL-E renders the dish accurately
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

  const dishContext = parts.join(". ");

  return (
    `Award-winning editorial food photograph of "${dishContext}".${ingredientHint} ` +
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
  const { title, description, ingredients, recipeId } = body as {
    title?: string;
    description?: string;
    ingredients?: string;
    recipeId?: string;
  };

  if (!title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  // 4. If recipeId provided, fetch English translations from Supabase
  //    and prefer them over the Russian originals for a better prompt.
  let promptTitle = title.trim();
  let promptDescription = description?.trim();
  let promptIngredients = ingredients?.trim();

  if (recipeId && isValidUUID(recipeId)) {
    const supabaseAdmin = createServiceRoleClient();
    const { data: recipe } = await supabaseAdmin
      .from("recipes")
      .select("title_en, description_en, ingredients_en")
      .eq("id", recipeId)
      .single();

    if (recipe) {
      // Use English fields when available — they produce better DALL-E results
      if (recipe.title_en)       promptTitle       = recipe.title_en;
      if (recipe.description_en) promptDescription = recipe.description_en;
      if (recipe.ingredients_en) promptIngredients = recipe.ingredients_en;
    }
  }

  // 5. Check OpenAI key is configured
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "YOUR_OPENAI_API_KEY_HERE") {
    return NextResponse.json(
      { error: "OPENAI_API_KEY не настроен. Добавь ключ в .env.local" },
      { status: 500 }
    );
  }

  // 6. Generate image — tries gpt-image-1 first (same model as ChatGPT, much more photorealistic),
  //    falls back to DALL-E 3 if billing limit is hit.
  const openai = new OpenAI({ apiKey });
  const prompt = buildPrompt(promptTitle, promptDescription, promptIngredients);

  console.log("[generate-image] prompt:", prompt.slice(0, 200));

  let imageBuffer: Buffer;
  let modelUsed = "gpt-image-1";

  try {
    // Attempt 1: gpt-image-1
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: "1024x1024", // square — cheaper than 1536x1024, same quality; crops nicely to 16:7 card
      quality: "medium", // "high" takes >60s and times out; "medium" is fast and looks great
    });

    // gpt-image-1 returns base64-encoded image data directly (no expiring URLs)
    const b64 = response.data?.[0]?.b64_json;
    if (!b64) throw new Error("OpenAI вернул пустой ответ");
    imageBuffer = Buffer.from(b64, "base64");
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isBillingError = message.includes("billing") || message.includes("quota") || message.includes("limit");

    if (!isBillingError) {
      console.error("[generate-image] OpenAI gpt-image-1 error:", err);
      return NextResponse.json({ error: `Ошибка генерации: ${message}` }, { status: 500 });
    }

    // Fallback to DALL-E 3 if billing limit reached
    console.warn("[generate-image] gpt-image-1 billing limit hit, falling back to dall-e-3");
    modelUsed = "dall-e-3";
    try {
      const fallbackResponse = await openai.images.generate({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
        response_format: "url",
      });
      const url = fallbackResponse.data?.[0]?.url;
      if (!url) throw new Error("DALL-E 3 вернул пустой ответ");
      const fetchRes = await fetch(url);
      if (!fetchRes.ok) throw new Error(`HTTP ${fetchRes.status}`);
      imageBuffer = Buffer.from(await fetchRes.arrayBuffer());
    } catch (fallbackErr) {
      console.error("[generate-image] DALL-E 3 fallback error:", fallbackErr);
      const fallbackMessage = fallbackErr instanceof Error ? fallbackErr.message : String(fallbackErr);
      return NextResponse.json({ error: `Ошибка генерации: ${fallbackMessage}` }, { status: 500 });
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

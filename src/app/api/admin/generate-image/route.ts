import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient, isAdmin } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

// DALL-E 3 can take up to 60s on slower prompts
export const maxDuration = 60;

/**
 * Builds a DALL-E 3 prompt consistent with the Cookbook visual style:
 * warm, top-down food photography, wooden surface, muted tones.
 */
function buildPrompt(title: string, description?: string): string {
  const subject = description
    ? `${title} — ${description}`
    : title;

  return (
    `Food photography of ${subject}. ` +
    `Top-down view (flat lay), warm natural light from above, ` +
    `rustic wooden surface, soft diffused shadows, small natural props (herbs, linen napkin). ` +
    `Appetizing and cozy home-kitchen aesthetic, film photography feel, ` +
    `muted warm tones (cream, sand, peach), shallow depth of field. ` +
    `High-end editorial food magazine style. No text, no watermarks.`
  );
}

export async function POST(req: NextRequest) {
  // 1. Verify authentication
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Verify admin role
  if (!(await isAdmin(user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 3. Parse request body
  const body = await req.json().catch(() => ({}));
  const { title, description } = body as { title?: string; description?: string };

  if (!title?.trim()) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  // 4. Check OpenAI key is configured
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "YOUR_OPENAI_API_KEY_HERE") {
    return NextResponse.json(
      { error: "OPENAI_API_KEY не настроен. Добавь ключ в .env.local" },
      { status: 500 }
    );
  }

  // 5. Generate image via DALL-E 3
  const openai = new OpenAI({ apiKey });
  const prompt = buildPrompt(title.trim(), description?.trim());

  let imageUrl: string;
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1792x1024", // closest to 16:9, great for recipe covers
      quality: "standard",
      response_format: "url",
    });

    const url = response.data?.[0]?.url;
    if (!url) throw new Error("OpenAI вернул пустой ответ");
    imageUrl = url;
  } catch (err) {
    console.error("[generate-image] OpenAI error:", err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Ошибка генерации: ${message}` }, { status: 500 });
  }

  // 6. Download the generated image (OpenAI URLs expire in ~1h)
  let imageBuffer: Buffer;
  try {
    const fetchRes = await fetch(imageUrl);
    if (!fetchRes.ok) throw new Error(`HTTP ${fetchRes.status}`);
    imageBuffer = Buffer.from(await fetchRes.arrayBuffer());
  } catch (err) {
    console.error("[generate-image] Download error:", err);
    return NextResponse.json({ error: "Не удалось скачать сгенерированное изображение" }, { status: 500 });
  }

  // 7. Upload to Supabase Storage
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/^-|-$/g, "");
  const fileName = `ai-${slug}-${Date.now()}.webp`;
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

  // 8. Get the public URL
  const { data: publicUrlData } = supabaseAdmin.storage
    .from("recipe-covers")
    .getPublicUrl(storagePath);

  return NextResponse.json({
    url: publicUrlData.publicUrl,
    path: storagePath,
    prompt, // useful for debugging / regeneration
  });
}

/**
 * POST /api/admin/revalidate-recipe
 *
 * Сбрасывает ISR-кеш страниц, затронутых правкой рецепта, чтобы изменения
 * появлялись на проде сразу, а не в течение часа (revalidate=3600).
 *
 * Зачем нужен: рецепт сохраняется через updateRecipe/createRecipe напрямую в
 * Supabase (минуя API), поэтому правки текста/обложки сами по себе не
 * инвалидируют кеш. Форма дёргает этот роут после сохранения.
 *
 * Инвалидируем:
 *   - /recipes/[slug] — детальная страница (ISR)
 *   - /              — главная (featured-рецепты, статика)
 *   (/recipes — клиентский фетч, всегда свежий, не трогаем)
 *
 * Body: { slug: string }
 * Auth: только админ.
 */
import { requireAdmin, isAuthSuccess } from "@/lib/api-auth";
import { RevalidateRecipeRequestSchema } from "@/lib/validations";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!isAuthSuccess(auth)) return auth;

  const body = await req.json().catch(() => ({}));
  const parsed = RevalidateRecipeRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { slug } = parsed.data;

  revalidatePath(`/recipes/${slug}`);
  revalidatePath("/");

  return NextResponse.json({ revalidated: true, slug });
}

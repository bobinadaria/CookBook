/**
 * POST /api/recipes/resolve-alias
 *
 * Сохраняет personal-алиас для пользователя: «считать стрэчателла как моцарелла»
 * или «пропустить уксусную эссенцию». Опционально пересчитывает КБЖУ переданного
 * состава и возвращает его в том же ответе — чтобы форма обновила цифру без
 * лишних запросов.
 *
 * Body:
 *   alias_text:                 строка имени, как написал юзер ("стрэчателла")
 *   canonical_ingredient_id?:   uuid из ingredients_base — если выбирает замену
 *   is_skip?:                   true — если выбирает «пропустить из расчёта»
 *   ingredients_text?:          опционально текст рецепта для recalc
 *   servings?:                  опционально число порций для recalc
 *
 * Mutually-exclusive: должен быть либо canonical_ingredient_id, либо is_skip=true.
 *
 * Доступ: залогиненный пользователь (роль не важна). AI-расчёт (если просим recalc)
 * требует aiEnabled — это unfair при бесплатном тарифе, но в MVP можно. Если есть
 * жалобы — добавим гейт.
 */
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { calculateNutrition } from "@/lib/nutrition/calculate";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const maxDuration = 60;

const BodySchema = z
  .object({
    alias_text: z.string().min(1).max(200).trim(),
    canonical_ingredient_id: z.string().uuid().optional(),
    is_skip: z.boolean().optional(),
    ingredients_text: z.string().max(20000).optional(),
    servings: z.number().int().positive().nullable().optional(),
  })
  .refine(
    (b) => (b.is_skip === true) !== !!b.canonical_ingredient_id,
    "Нужно либо canonical_ingredient_id, либо is_skip=true (но не оба).",
  );

export async function POST(req: NextRequest) {
  // 1. Auth.
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Validate body.
  const body = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const {
    alias_text,
    canonical_ingredient_id,
    is_skip,
    ingredients_text,
    servings,
  } = parsed.data;

  const admin = createServiceRoleClient();

  // 3. Если есть canonical_ingredient_id — проверим, что такой ингредиент
  //    реально существует в базе (защита от мусора с фронта).
  if (canonical_ingredient_id) {
    const { data: ingredientRow, error: ingredientError } = await admin
      .from("ingredients_base")
      .select("id")
      .eq("id", canonical_ingredient_id)
      .maybeSingle();
    if (ingredientError || !ingredientRow) {
      return NextResponse.json(
        { error: "canonical_ingredient_id не найден в ingredients_base" },
        { status: 404 },
      );
    }
  }

  // 4. UPSERT алиаса. UNIQUE (alias_text, user_id) гарантирует один на юзера.
  const row = {
    alias_text,
    user_id: user.id,
    canonical_id: canonical_ingredient_id ?? null,
    is_skip: !!is_skip,
  };
  const { data: alias, error: upsertError } = await admin
    .from("ingredient_aliases")
    .upsert(row, { onConflict: "alias_text,user_id" })
    .select()
    .single();

  if (upsertError) {
    return NextResponse.json(
      { error: `Не удалось сохранить алиас: ${upsertError.message}` },
      { status: 500 },
    );
  }

  // 5. Если фронт прислал состав — сразу пересчитаем и вернём новую nutrition.
  if (ingredients_text && ingredients_text.trim().length > 0) {
    try {
      const nutrition = await calculateNutrition({
        ingredientsText: ingredients_text,
        servings: servings ?? null,
        supabase: admin,
        userId: user.id,
        estimateUnmatched: true,
      });
      return NextResponse.json({ alias, nutrition });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("[resolve-alias] recalc failed:", msg);
      // Алиас сохранили, recalc упал — возвращаем alias без nutrition,
      // фронт переспросит /calculate-nutrition самостоятельно.
      return NextResponse.json({ alias, recalcError: msg });
    }
  }

  return NextResponse.json({ alias });
}

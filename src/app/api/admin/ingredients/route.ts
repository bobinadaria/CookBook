/**
 * POST /api/admin/ingredients
 *
 * Добавляет ингредиент в `ingredients_base` со страницы
 * /admin/ingredient-requests («+ Добавить в базу»). Зеркалит upsert, который
 * раньше делали только вручную через scripts/seed-*.mjs (service-role, т.к.
 * у ingredients_base нет RLS-политики на запись для обычных admin-сессий).
 *
 * После успешного upsert удаляет обработанные запросы из ingredient_requests
 * (по parsed_name) — RLS-политика "admin delete" на эту таблицу уже есть.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isAuthSuccess } from "@/lib/api-auth";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { NewIngredientSchema } from "@/lib/validations";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if (!isAuthSuccess(auth)) return auth;

  const json = await req.json().catch(() => null);
  const parsed = NewIngredientSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }
  const { name_ru, name_en, category, kcal_100g, protein_100g, fat_100g, carbs_100g, usda_fdc_id, resolvedRequestNames } =
    parsed.data;

  const supabase = createServiceRoleClient();

  const { error: upsertError } = await supabase.from("ingredients_base").upsert(
    {
      name_ru: name_ru.trim(),
      name_en: name_en.trim() || null,
      category,
      kcal_100g,
      protein_100g,
      fat_100g,
      carbs_100g,
      usda_fdc_id: usda_fdc_id.trim() || null,
    },
    { onConflict: "name_ru" },
  );

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  // Чистим очередь запросов — не блокирует успех, если что-то пойдёт не так.
  if (resolvedRequestNames.length > 0) {
    await supabase.from("ingredient_requests").delete().in("parsed_name", resolvedRequestNames);
  }

  return NextResponse.json({ ok: true });
}

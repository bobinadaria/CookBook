/**
 * POST /api/recipes/request-ingredient
 *
 * Сохраняет запрос пользователя на добавление ингредиента в базу.
 * Дарья видит список в /admin/ingredient-requests и добавляет вручную.
 *
 * Body:
 *   original_text:  сырая строка из рецепта («щавель свежий — 250 г»)
 *   parsed_name:    имя, которое выделил парсер («щавель свежий»)
 */
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const BodySchema = z.object({
  original_text: z.string().min(1).max(500).trim(),
  parsed_name: z.string().min(1).max(200).trim(),
});

export async function POST(req: NextRequest) {
  const supabaseAuth = await createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const admin = createServiceRoleClient();
  const { error } = await admin.from("ingredient_requests").insert({
    original_text: parsed.data.original_text,
    parsed_name: parsed.data.parsed_name,
    user_id: user.id,
  });

  if (error) {
    return NextResponse.json(
      { error: `Не удалось сохранить запрос: ${error.message}` },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}

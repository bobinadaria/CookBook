/**
 * POST /api/recipes/calculate-nutrition
 *
 * Считает КБЖУ ПО ТЕКСТУ состава (без recipeId и без сохранения) для текущего
 * пользователя и возвращает результат. Сохраняет его потом форма — вместе с
 * рецептом. Так расчёт работает прямо в форме, в т.ч. для нового, ещё не
 * сохранённого рецепта.
 *
 * Доступ (гейт): нужен залогиненный пользователь с планом, дающим AI
 * (entitlements.aiEnabled → premium/lifetime). Free → 403. Так приглашённые
 * тестеры получают AI до запуска монетизации (profiles.plan='premium').
 *
 * Body: { ingredients: string, servings?: number | null }
 * Возвращает: { nutrition }
 */
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getEntitlements } from "@/lib/entitlements";
import { UserNutritionCalcSchema } from "@/lib/validations";
import { calculateNutrition } from "@/lib/nutrition/calculate";
import { NextRequest, NextResponse } from "next/server";

// OpenAI-парсинг может занять до ~30с на большом составе.
export const maxDuration = 60;

/**
 * Best-effort per-user rate limit. AI-вызовы стоят денег, поэтому ограничиваем
 * частоту. NOTE: in-memory, живёт в пределах тёплого инстанса — грубая защита от
 * циклов злоупотребления, не жёсткая квота. Глобальный потолок — лимит в OpenAI.
 */
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 10; // расчётов в минуту на пользователя
const calcHits = new Map<string, number[]>();
function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const recent = (calcHits.get(userId) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  if (recent.length >= RATE_MAX) {
    calcHits.set(userId, recent);
    return true;
  }
  recent.push(now);
  calcHits.set(userId, recent);
  return false;
}

export async function POST(req: NextRequest) {
  // 1. Требуется аутентифицированная сессия (роль admin НЕ нужна).
  const supabaseAuth = createClient();
  const {
    data: { user },
  } = await supabaseAuth.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Гейт доступа к AI по плану (premium/lifetime). Free → 403.
  const { aiEnabled } = await getEntitlements(user.id);
  if (!aiEnabled) {
    return NextResponse.json(
      { error: "AI-функции недоступны для вашего аккаунта." },
      { status: 403 },
    );
  }

  // 3. Грубый rate-limit (AI стоит денег).
  if (isRateLimited(user.id)) {
    return NextResponse.json(
      { error: "Слишком часто. Подождите немного и попробуйте снова." },
      { status: 429 },
    );
  }

  // 4. Валидация тела.
  const body = await req.json().catch(() => ({}));
  const parsed = UserNutritionCalcSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { ingredients, servings } = parsed.data;

  if (!ingredients.trim()) {
    return NextResponse.json(
      { error: "Пустой состав — нечего считать." },
      { status: 422 },
    );
  }

  // 5. Парс → матч → расчёт (тот же движок, что и в админке). service-role нужен
  //    для чтения справочника ingredients_base внутри calculateNutrition.
  //    userId — чтобы подтянуть алиасы текущего юзера (стрэчателла → моцарелла и т.п.).
  const supabase = createServiceRoleClient();
  try {
    const nutrition = await calculateNutrition({
      ingredientsText: ingredients,
      servings: servings ?? null,
      supabase,
      userId: user.id,
    });
    return NextResponse.json({ nutrition });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[user calculate-nutrition] failed:", msg);
    return NextResponse.json(
      { error: "Не удалось рассчитать КБЖУ. Попробуйте ещё раз." },
      { status: 500 },
    );
  }
}

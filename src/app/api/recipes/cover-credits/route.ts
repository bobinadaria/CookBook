/**
 * GET /api/recipes/cover-credits
 *
 * Возвращает актуальный баланс AI-обложек для авторизованного пользователя.
 * Используется в форме рецепта для обновления счётчика после возврата
 * со страницы покупки (новая вкладка → visibilitychange → re-fetch).
 *
 * { credits: number } — если монетизация включена и план paid
 * { credits: null }   — если монетизация выключена (бета) или план free
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { getEntitlements, isMonetizationEnabled } from "@/lib/entitlements";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isMonetizationEnabled()) {
    return NextResponse.json({ credits: null });
  }

  const { aiEnabled } = await getEntitlements(user.id);
  if (!aiEnabled) {
    // Free план — пакеты не доступны
    return NextResponse.json({ credits: null });
  }

  const admin = createServiceRoleClient();
  const { data, error } = await admin.rpc("get_cover_balance", { p_user_id: user.id });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ credits: data as number });
}

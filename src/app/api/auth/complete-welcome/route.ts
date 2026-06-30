import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";

/**
 * POST /api/auth/complete-welcome
 * Вызывается со страницы /welcome (Google OAuth onboarding).
 * Сохраняет marketing_consent и ставит welcome_shown=true в profiles.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let marketing_consent = false;
  try {
    const body = await request.json() as { marketing_consent?: boolean };
    marketing_consent = Boolean(body.marketing_consent);
  } catch {
    // default false
  }

  const admin = createServiceRoleClient();
  await admin
    .from("profiles")
    .update({ marketing_consent, welcome_shown: true })
    .eq("id", user.id);

  return NextResponse.json({ ok: true });
}

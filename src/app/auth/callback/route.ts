import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

/**
 * Handles Supabase auth callbacks:
 * - Email confirmation after registration → copies marketing_consent to profiles, redirects to /
 * - Google OAuth (new users) → redirects to /welcome for onboarding
 * - Password reset links → redirects to /reset-password
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
  }

  const supabase = await createClient();
  const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !sessionData.user) {
    return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
  }

  const user = sessionData.user;
  const provider = user.app_metadata?.provider as string | undefined;
  const adminClient = createServiceRoleClient();

  if (provider === "google") {
    // Google OAuth: check if this is the first login (welcome_shown = false)
    const { data: profile } = await adminClient
      .from("profiles")
      .select("welcome_shown")
      .eq("id", user.id)
      .single();

    if (profile && !profile.welcome_shown) {
      // First-time Google user → onboarding page
      return NextResponse.redirect(`${origin}/welcome`);
    }

    // Returning Google user → normal flow
    return NextResponse.redirect(`${origin}${next}`);
  }

  // Email/password user: copy marketing_consent from user metadata to profiles
  const marketingConsent = user.user_metadata?.marketing_consent ?? false;
  await adminClient
    .from("profiles")
    .update({ marketing_consent: marketingConsent, welcome_shown: true })
    .eq("id", user.id);

  return NextResponse.redirect(`${origin}${next}`);
}

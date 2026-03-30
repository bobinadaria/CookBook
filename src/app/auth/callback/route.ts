import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Handles Supabase auth callbacks:
 * - Email confirmation after registration
 * - Password reset links
 *
 * Supabase redirects here after the user clicks the link in their email.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Redirect to the intended page (e.g. / for login, /reset-password for password reset)
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If something went wrong, redirect to login with error flag
  return NextResponse.redirect(`${origin}/login?error=confirmation_failed`);
}

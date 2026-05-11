/**
 * Shared authentication helpers for API Route Handlers.
 *
 * Usage in any /api/admin/* route:
 *
 *   const authResult = await requireAdmin();
 *   if (authResult instanceof NextResponse) return authResult; // 401 or 403
 *   const { user } = authResult;
 */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/supabase/admin";

interface AuthSuccess {
  userId: string;
}

type AuthResult = AuthSuccess | NextResponse;

/**
 * Verifies that the current request is authenticated AND that the user
 * has the `admin` role.
 *
 * Returns `{ userId }` on success, or a `NextResponse` (401 / 403) that
 * the route handler should return immediately.
 */
export async function requireAdmin(): Promise<AuthResult> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminCheck = await isAdmin(user.id);
  if (!adminCheck) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return { userId: user.id };
}

/** Type guard: narrows the result of `requireAdmin` to the success case. */
export function isAuthSuccess(result: AuthResult): result is AuthSuccess {
  return !(result instanceof NextResponse);
}

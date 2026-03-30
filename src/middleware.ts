import { type NextRequest, NextResponse } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/middleware";

const intlMiddleware = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  // 1. Run next-intl middleware (resolves locale, sets headers + cookie)
  const intlResponse = intlMiddleware(request);

  // 2. Run Supabase auth middleware
  const { supabaseResponse, user } = await updateSession(request);
  const { pathname } = request.nextUrl;

  // 3. Copy locale-related headers from intl response to supabase response
  const intlLocale = intlResponse.headers.get("x-next-intl-locale");
  if (intlLocale) {
    supabaseResponse.headers.set("x-next-intl-locale", intlLocale);
  }
  const localeCookie = intlResponse.cookies.get("NEXT_LOCALE");
  if (localeCookie) {
    supabaseResponse.cookies.set(localeCookie.name, localeCookie.value, {
      path: "/",
      sameSite: "lax",
      maxAge: 365 * 24 * 60 * 60,
    });
  }

  // 4. Auth protection — /dashboard and /admin require login
  //    Admin role check happens in admin/layout.tsx and API routes (server-side)
  if ((pathname.startsWith("/dashboard") || pathname.startsWith("/admin")) && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

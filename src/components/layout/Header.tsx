"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { createClient } from "@/lib/supabase/client";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";
import type { User } from "@supabase/supabase-js";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("nav");
  const { direction, scrollY } = useScrollDirection();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const visible = scrollY < 80 || direction === "up";

  // «Избранное»/«Заметки» живут внутри личного кабинета, а не в верхней навигации.
  // Вход в кабинет — через email-чип справа (см. ниже).
  const navLinks = [
    { href: "/recipes", label: t("recipes") },
  ];

  useEffect(() => {
    const supabase = createClient();

    const checkAdmin = async (userId: string) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", userId)
        .single();
      setIsAdmin(profile?.role === "admin");
    };

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) checkAdmin(data.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) checkAdmin(session.user.id);
      else setIsAdmin(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const handleSignOut = async () => {
    setSigningOut(true);
    setMobileOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50",
          "bg-cream/90 backdrop-blur-sm border-b border-sand",
          "transition-transform duration-300 ease-in-out",
          // pt-safe accounts for iPhone notch / Dynamic Island safe area.
          // Without viewport-fit=cover in layout.tsx this is always 0.
          "pt-safe",
          visible ? "translate-y-0" : "-translate-y-full"
        )}
      >
        <div className="px-4 sm:px-8 h-16 flex items-center justify-between">
          <Link
            href="/"
            className="font-handwritten text-2xl text-charcoal hover:text-peach transition-colors"
          >
            CookBook
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-peach",
                  pathname === link.href ? "text-peach" : "text-charcoal/70"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop right controls */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <LanguageSwitcher />

            {user ? (
              <>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className={cn(
                      "text-sm font-medium transition-colors hover:text-peach",
                      pathname.startsWith("/admin") ? "text-peach" : "text-charcoal/50"
                    )}
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href="/dashboard"
                  className={cn(
                    "text-sm font-medium max-w-[160px] truncate transition-colors hover:text-peach",
                    pathname.startsWith("/dashboard") ? "text-peach" : "text-charcoal/60"
                  )}
                  title={t("dashboard")}
                >
                  {user.email}
                </Link>
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="text-sm font-medium text-charcoal/60 hover:text-peach transition-colors disabled:opacity-50"
                >
                  {signingOut ? "..." : t("signOut")}
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-charcoal/70 hover:text-charcoal transition-colors">
                  {t("signIn")}
                </Link>
                <Link href="/register" className="text-sm font-medium bg-peach text-white px-4 py-2 rounded-full hover:bg-peach-dark transition-colors">
                  {t("register")}
                </Link>
              </>
            )}
          </div>

          {/* Mobile right controls */}
          <div className="flex md:hidden items-center gap-1">
            <ThemeToggle />
            <LanguageSwitcher />

            {/*
              Hamburger button.
              p-3 gives a 22px icon + 24px padding = 46px tap area → meets 44px minimum.
              The aria-expanded attribute helps screen readers and iOS VoiceOver.
            */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              className="p-3 -mr-1 text-charcoal/70 hover:text-peach transition-colors"
            >
              {mobileOpen ? (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <line x1="4" y1="4" x2="18" y2="18" />
                  <line x1="18" y1="4" x2="4" y2="18" />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
                  <line x1="3" y1="6" x2="19" y2="6" />
                  <line x1="3" y1="11" x2="19" y2="11" />
                  <line x1="3" y1="16" x2="19" y2="16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileOpen && (
          <div
            id="mobile-menu"
            className="md:hidden bg-cream/95 backdrop-blur-sm border-t border-sand px-4 py-3 flex flex-col"
          >
            {navLinks.map((link) => (
              /*
               * Each nav link is min-h-[48px] — slightly above Apple's 44px
               * minimum — so it's comfortable to tap even with fat fingers.
               */
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center min-h-[48px] text-base font-medium transition-colors hover:text-peach",
                  pathname === link.href ? "text-peach" : "text-charcoal/70"
                )}
              >
                {link.label}
              </Link>
            ))}

            <div className="h-px bg-sand my-2" />

            {user ? (
              <>
                <Link
                  href="/dashboard"
                  className={cn(
                    "flex items-center min-h-[48px] text-base font-medium transition-colors hover:text-peach",
                    pathname.startsWith("/dashboard") ? "text-peach" : "text-charcoal/70"
                  )}
                >
                  {t("dashboard")}
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="flex items-center min-h-[48px] text-base font-medium text-charcoal/50 hover:text-peach transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <p className="text-sm text-charcoal/40 truncate py-2">{user.email}</p>
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="flex items-center min-h-[48px] text-left text-base font-medium text-charcoal/60 hover:text-peach transition-colors disabled:opacity-50"
                >
                  {signingOut ? "..." : t("signOut")}
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-1 pb-2">
                <Link
                  href="/login"
                  className="flex items-center min-h-[48px] text-base font-medium text-charcoal/70 hover:text-charcoal transition-colors"
                >
                  {t("signIn")}
                </Link>
                <Link
                  href="/register"
                  className="flex items-center justify-center min-h-[48px] text-base font-medium bg-peach text-white px-4 rounded-full hover:bg-peach-dark transition-colors"
                >
                  {t("register")}
                </Link>
              </div>
            )}

            {/* Bottom safe area — ensures menu content isn't hidden behind iOS home indicator */}
            <div className="pb-safe" />
          </div>
        )}
      </header>
    </>
  );
}

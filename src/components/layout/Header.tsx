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

  const navLinks = [
    { href: "/recipes", label: t("recipes") },
    { href: "/dashboard/favorites", label: t("favorites") },
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
      if (session?.user) {
        checkAdmin(session.user.id);
      } else {
        setIsAdmin(false);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

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
                <span className="text-sm text-charcoal/40 max-w-[140px] truncate">
                  {user.email}
                </span>
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
                <Link
                  href="/login"
                  className="text-sm font-medium text-charcoal/70 hover:text-charcoal transition-colors"
                >
                  {t("signIn")}
                </Link>
                <Link
                  href="/register"
                  className="text-sm font-medium bg-peach text-white px-4 py-2 rounded-full hover:bg-peach-dark transition-colors"
                >
                  {t("register")}
                </Link>
              </>
            )}
          </div>

          {/* Mobile right controls */}
          <div className="flex md:hidden items-center gap-2">
            <ThemeToggle />
            <LanguageSwitcher />

            {/* Hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Меню"
              className="p-2 text-charcoal/70 hover:text-peach transition-colors"
            >
              {mobileOpen ? (
                // X icon
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="4" y1="4" x2="18" y2="18" />
                  <line x1="18" y1="4" x2="4" y2="18" />
                </svg>
              ) : (
                // Hamburger icon
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
          <div className="md:hidden bg-cream/95 backdrop-blur-sm border-t border-sand px-4 py-5 flex flex-col gap-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "text-base font-medium transition-colors hover:text-peach",
                  pathname === link.href ? "text-peach" : "text-charcoal/70"
                )}
              >
                {link.label}
              </Link>
            ))}

            <div className="h-px bg-sand my-1" />

            {user ? (
              <>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="text-base font-medium text-charcoal/50 hover:text-peach transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <p className="text-sm text-charcoal/40 truncate">{user.email}</p>
                <button
                  onClick={handleSignOut}
                  disabled={signingOut}
                  className="text-left text-base font-medium text-charcoal/60 hover:text-peach transition-colors disabled:opacity-50"
                >
                  {signingOut ? "..." : t("signOut")}
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-3">
                <Link
                  href="/login"
                  className="text-base font-medium text-charcoal/70 hover:text-charcoal transition-colors"
                >
                  {t("signIn")}
                </Link>
                <Link
                  href="/register"
                  className="text-center text-base font-medium bg-peach text-white px-4 py-2.5 rounded-full hover:bg-peach-dark transition-colors"
                >
                  {t("register")}
                </Link>
              </div>
            )}
          </div>
        )}
      </header>
    </>
  );
}

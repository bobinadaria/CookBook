"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";
import type { User } from "@supabase/supabase-js";

interface NavItem {
  href: string;
  label: string;
  active: boolean;
}

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("nav");
  const th = useTranslations("header");

  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) checkAdmin(session.user.id);
      else setIsAdmin(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Закрывать мобильное меню при смене маршрута
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

  const navItems: NavItem[] = [
    { href: "/", label: t("home"), active: pathname === "/" },
    { href: "/recipes", label: t("recipes"), active: pathname.startsWith("/recipes") },
    { href: "/pricing", label: t("pricing"), active: pathname.startsWith("/pricing") },
  ];
  if (user) {
    navItems.push({
      href: "/dashboard",
      label: t("myBook"),
      active: pathname.startsWith("/dashboard"),
    });
  }
  if (isAdmin) {
    navItems.push({ href: "/admin", label: "Админ", active: pathname.startsWith("/admin") });
  }

  return (
    <header className="bg-paper">
      {/* ─── Desktop masthead (md+) ─────────────────────────────────────── */}
      <div className="hidden md:block">
        {/* Top strip */}
        <div className="flex items-center justify-between border-b border-rule px-6 py-2 font-body text-[10px] font-semibold uppercase tracking-[0.16em] text-soft lg:px-14">
          <span>{th("tagline")}</span>
          <span className="flex items-center gap-5">
            <LanguageSwitcher />
            <ThemeToggle />
            {user ? (
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="uppercase tracking-[0.16em] text-soft transition-colors hover:text-burg disabled:opacity-50"
              >
                {signingOut ? "…" : t("signOut")}
              </button>
            ) : (
              <Link href="/login" className="text-burg transition-colors hover:text-ochre-dk">
                {t("signIn")} &rarr;
              </Link>
            )}
          </span>
        </div>

        {/* Masthead row */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-5 px-6 pb-5 pt-9 lg:px-14">
          <span className="justify-self-start font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-soft">
            {th("taglineLeft")}
          </span>
          <Link href="/" className="flex flex-col items-center justify-self-center">
            <span className="whitespace-nowrap font-display text-[48px] font-normal italic leading-[0.9] tracking-[-0.02em] text-burg lg:text-[72px]">
              The Slow Table
            </span>
            <span className="mt-1 font-body text-[10px] font-semibold uppercase tracking-[0.3em] text-soft">
              by Daria
            </span>
          </Link>
          <span className="justify-self-end font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-soft">
            {th("taglineRight")}
          </span>
        </div>

        {/* Nav row — sticky */}
        <nav className="sticky top-0 z-40 flex justify-center gap-12 border-y border-rule bg-paper/95 px-6 py-3.5 backdrop-blur-sm lg:gap-14 lg:px-14">
          {navItems.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                "border-b-2 py-1 font-body text-[12px] uppercase tracking-[0.16em] transition-colors",
                it.active
                  ? "border-burg font-bold text-burg"
                  : "border-transparent font-medium text-soft hover:text-burg",
              )}
            >
              {it.label}
            </Link>
          ))}
        </nav>
      </div>

      {/* ─── Mobile bar (<md) — sticky ──────────────────────────────────── */}
      <div className="sticky top-0 z-50 border-b border-rule bg-paper/95 pt-safe backdrop-blur-sm md:hidden">
        <div className="flex h-14 items-center justify-between px-6">
          <Link href="/" className="font-display text-[22px] italic leading-none text-burg">
            The Slow Table
          </Link>
          <div className="flex items-center gap-1">
            <LanguageSwitcher />
            <ThemeToggle />
            <button
              onClick={() => setMobileOpen((v) => !v)}
              aria-label={mobileOpen ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              className="-mr-1 flex h-11 w-11 flex-col items-center justify-center gap-[5px] text-burg"
            >
              <span
                className={cn(
                  "block h-[2px] w-5 bg-current transition-transform",
                  mobileOpen && "translate-y-[7px] rotate-45",
                )}
              />
              <span className={cn("block h-[2px] w-5 bg-current transition-opacity", mobileOpen && "opacity-0")} />
              <span
                className={cn(
                  "block h-[2px] w-5 bg-current transition-transform",
                  mobileOpen && "-translate-y-[7px] -rotate-45",
                )}
              />
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div id="mobile-menu" className="flex flex-col border-t border-rule px-6 py-2">
            {navItems.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className={cn(
                  "flex min-h-[48px] items-center font-body text-[13px] uppercase tracking-[0.16em] transition-colors",
                  it.active ? "font-bold text-burg" : "font-medium text-soft hover:text-burg",
                )}
              >
                {it.label}
              </Link>
            ))}

            <div className="my-2 h-px bg-rule" />

            {user ? (
              <button
                onClick={handleSignOut}
                disabled={signingOut}
                className="flex min-h-[48px] items-center text-left font-body text-[13px] uppercase tracking-[0.16em] text-soft transition-colors hover:text-burg disabled:opacity-50"
              >
                {signingOut ? "…" : t("signOut")}
              </button>
            ) : (
              <div className="flex flex-col gap-2 pb-2 pt-1">
                <Link
                  href="/login"
                  className="flex min-h-[48px] items-center font-body text-[13px] uppercase tracking-[0.16em] text-soft transition-colors hover:text-burg"
                >
                  {t("signIn")}
                </Link>
                <Link
                  href="/register"
                  className="flex min-h-[48px] items-center justify-center bg-burg px-4 font-body text-[13px] font-semibold uppercase tracking-[0.16em] text-paper transition-colors hover:bg-burg-dk"
                >
                  {t("register")}
                </Link>
              </div>
            )}

            <div className="pb-safe" />
          </div>
        )}
      </div>
    </header>
  );
}

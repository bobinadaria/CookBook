"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
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
  const t = useTranslations("nav");
  const th = useTranslations("header");

  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [plan, setPlan] = useState<"free" | "premium" | "lifetime" | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    let currentUserId: string | null = null;

    const applyUser = async (nextUser: User | null) => {
      currentUserId = nextUser?.id ?? null;
      setUser(nextUser);
      setIsAdmin(false);
      if (!nextUser) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, plan, display_name")
        .eq("id", nextUser.id)
        .single();

      if (currentUserId !== nextUser.id) return;
      setIsAdmin(profile?.role === "admin");
      setDisplayName(profile?.display_name ?? null);
      const p = profile?.plan;
      setPlan(p === "premium" || p === "lifetime" ? p : "free");
    };

    supabase.auth.getUser().then(({ data }) => applyUser(data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applyUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Закрывать всё при смене маршрута
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  // Закрывать дропдаун при клике вне его
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  // Блокируем прокрутку фона, пока открыто мобильное меню
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [mobileOpen]);

  const inCabinet = pathname.startsWith("/dashboard");

  let navItems: NavItem[];
  if (inCabinet) {
    navItems = [{ href: "/", label: `← ${t("backToSite")}`, active: false }];
  } else {
    navItems = [
      { href: "/", label: t("home"), active: pathname === "/" },
      { href: "/recipes", label: t("recipes"), active: pathname.startsWith("/recipes") },
    ];
    if (isAdmin) {
      navItems.push({ href: "/admin", label: t("admin"), active: pathname.startsWith("/admin") });
    }
  }

  const planLabel = plan === "lifetime" ? "Lifetime" : plan === "premium" ? "Premium" : "Free";
  const userInitial = (displayName ?? user?.email ?? "?")[0].toUpperCase();
  const userName = displayName || user?.email?.split("@")[0] || "";

  const handleSignOut = async () => {
    setDropdownOpen(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // Дропдаун аватара (десктоп)
  const avatarDropdown = user ? (
    <div ref={dropdownRef} className="relative flex items-center gap-2.5">
      {/* Лейбл тарифа */}
      <Link
        href="/pricing"
        className={cn(
          "font-body text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors",
          plan === "free" ? "text-muted hover:text-burg" : "text-ochre-dk hover:text-burg",
        )}
      >
        {planLabel}
      </Link>

      {/* Аватар — триггер дропдауна */}
      <button
        type="button"
        onClick={() => setDropdownOpen((v) => !v)}
        aria-label="Открыть меню профиля"
        aria-expanded={dropdownOpen}
        className={cn(
          "flex h-7 w-7 items-center justify-center font-body text-[13px] font-bold transition-colors",
          dropdownOpen || inCabinet
            ? "bg-burg text-paper"
            : "bg-ink/10 text-ink hover:bg-burg hover:text-paper",
        )}
      >
        {userInitial}
      </button>

      {/* Дропдаун */}
      {dropdownOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-64 border border-rule bg-paper shadow-[0_4px_16px_rgba(21,17,13,0.10)]">
          {/* Имя пользователя */}
          <div className="border-b border-rule px-4 py-3 min-w-0">
            <p className="font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-ink truncate">
              {userName}
            </p>
            <p className="mt-0.5 font-body text-[10px] text-muted truncate">{user.email}</p>
          </div>

          {/* Пункты меню */}
          <nav className="py-1">
            <Link
              href="/dashboard/profile"
              className="flex items-center gap-2.5 px-4 py-2.5 font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-soft transition-colors hover:bg-crust hover:text-burg"
            >
              {t("myProfile")}
            </Link>
            <Link
              href="/dashboard"
              className="flex items-center gap-2.5 px-4 py-2.5 font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-soft transition-colors hover:bg-crust hover:text-burg"
            >
              {t("myBook")}
            </Link>
            <div className="my-1 h-px bg-rule" />
            <button
              type="button"
              onClick={handleSignOut}
              className="flex w-full items-center gap-2.5 px-4 py-2.5 font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-soft transition-colors hover:bg-crust hover:text-burg"
            >
              {t("signOut")}
            </button>
          </nav>
        </div>
      )}
    </div>
  ) : null;

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
              avatarDropdown
            ) : (
              <Link href="/login" className="text-burg transition-colors hover:text-ochre-dk">
                {t("signIn")} &rarr;
              </Link>
            )}
          </span>
        </div>

        {/* Логотип */}
        <div className="flex justify-center px-6 pb-5 pt-9 lg:px-14">
          <Link href="/" className="flex flex-col items-center">
            <span className="whitespace-nowrap font-display text-[48px] font-normal italic leading-[0.9] tracking-[-0.02em] text-burg lg:text-[72px]">
              The Slow Table
            </span>
            <span className="mt-1 font-body text-[10px] font-semibold uppercase tracking-[0.3em] text-soft">
              by Daria
            </span>
          </Link>
        </div>

        {/* Nav row — sticky */}
        <nav
          className={cn(
            "sticky top-0 z-40 flex gap-12 border-y border-rule bg-paper/95 px-6 py-3.5 backdrop-blur-sm lg:gap-14 lg:px-14",
            inCabinet ? "justify-start" : "justify-center",
          )}
        >
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
              <span className={cn("block h-[2px] w-5 bg-current transition-transform", mobileOpen && "translate-y-[7px] rotate-45")} />
              <span className={cn("block h-[2px] w-5 bg-current transition-opacity", mobileOpen && "opacity-0")} />
              <span className={cn("block h-[2px] w-5 bg-current transition-transform", mobileOpen && "-translate-y-[7px] -rotate-45")} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Mobile nav drawer (<md) ─────────────────────────────────────── */}
      <div
        className={cn(
          "fixed inset-0 z-[60] md:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!mobileOpen}
      >
        <div
          onClick={() => setMobileOpen(false)}
          className={cn(
            "absolute inset-0 bg-ink/40 transition-opacity duration-300",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
        />

        <aside
          id="mobile-menu"
          className={cn(
            "absolute right-0 top-0 flex h-full w-[82%] max-w-[320px] flex-col border-l border-rule bg-paper pt-safe",
            "shadow-[-8px_0_24px_rgba(21,17,13,0.12)] transition-transform duration-300 ease-out",
            mobileOpen ? "translate-x-0" : "translate-x-full",
          )}
        >
          <div className="flex h-14 items-center justify-between border-b border-rule px-6">
            <span className="font-display text-[18px] italic leading-none text-burg">The Slow Table</span>
            <button
              onClick={() => setMobileOpen(false)}
              aria-label="Закрыть меню"
              className="-mr-1 flex h-10 w-10 items-center justify-center text-lg text-soft transition-colors hover:text-burg"
            >
              ✕
            </button>
          </div>

          <nav className="flex flex-1 flex-col overflow-y-auto px-6 py-2">
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

            {user ? (
              <>
                <div className="my-2 h-px bg-rule" />
                {/* Имя + тариф */}
                <div className="mb-1 flex items-center justify-between py-2">
                  <span className="font-body text-[13px] font-semibold text-ink">{userName}</span>
                  <Link
                    href="/pricing"
                    className={cn(
                      "font-body text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors",
                      plan === "free" ? "text-muted hover:text-burg" : "text-ochre-dk hover:text-burg",
                    )}
                  >
                    {planLabel}
                  </Link>
                </div>
                <Link
                  href="/dashboard/profile"
                  className="flex min-h-[44px] items-center font-body text-[13px] uppercase tracking-[0.16em] text-soft transition-colors hover:text-burg"
                >
                  {t("myProfile")}
                </Link>
                <Link
                  href="/dashboard"
                  className={cn(
                    "flex min-h-[44px] items-center font-body text-[13px] uppercase tracking-[0.16em] transition-colors",
                    pathname.startsWith("/dashboard") ? "font-bold text-burg" : "text-soft hover:text-burg",
                  )}
                >
                  {t("myBook")}
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex min-h-[44px] items-center font-body text-[13px] uppercase tracking-[0.16em] text-soft transition-colors hover:text-burg"
                >
                  {t("signOut")}
                </button>
              </>
            ) : (
              <>
                <div className="my-2 h-px bg-rule" />
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
              </>
            )}

            <div className="pb-safe" />
          </nav>
        </aside>
      </div>
    </header>
  );
}

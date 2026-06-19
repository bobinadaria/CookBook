"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const t = useTranslations("nav");
  const th = useTranslations("header");

  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    // Какого пользователя мы сейчас «обслуживаем». Нужно, чтобы медленный
    // запрос роли из прошлой сессии не протёк админ-состоянием в другой аккаунт.
    let currentUserId: string | null = null;

    const applyUser = async (nextUser: User | null) => {
      currentUserId = nextUser?.id ?? null;
      setUser(nextUser);
      // Сброс в первую очередь: никогда не тащим флаг админа из прошлого аккаунта.
      setIsAdmin(false);
      if (!nextUser) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", nextUser.id)
        .single();

      // Игнорируем «опоздавший» ответ, если активный пользователь уже сменился.
      if (currentUserId !== nextUser.id) return;
      setIsAdmin(profile?.role === "admin");
    };

    supabase.auth.getUser().then(({ data }) => applyUser(data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applyUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Закрывать мобильное меню при смене маршрута
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Блокируем прокрутку фона, пока открыта боковая панель меню
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [mobileOpen]);

  // В кабинете («Моя книга») — отдельное пространство: глобальное меню
  // «Обложка/Рецепты» прячем, оставляем только «← На сайт» (выход в журнал).
  // Навигация внутри кабинета (Мои рецепты / Мой аккаунт) — это DashboardTabs.
  const inCabinet = pathname.startsWith("/dashboard");

  let navItems: NavItem[];
  if (inCabinet) {
    navItems = [{ href: "/", label: `← ${t("backToSite")}`, active: false }];
  } else {
    navItems = [
      { href: "/", label: t("home"), active: pathname === "/" },
      { href: "/recipes", label: t("recipes"), active: pathname.startsWith("/recipes") },
    ];
    if (!user) {
      // «Подписка» — витрина для гостей. У вошедших она живёт внутри «Моей книги».
      navItems.push({ href: "/pricing", label: t("pricing"), active: pathname.startsWith("/pricing") });
    }
    // «Моя книга» больше НЕ в центральном меню — она в правом верхнем углу.
    // Тариф и «Выйти» живут только в профиле (/dashboard → «Аккаунт»).
    if (isAdmin) {
      navItems.push({ href: "/admin", label: t("admin"), active: pathname.startsWith("/admin") });
    }
  }

  // Кнопка-вход в кабинет «Моя книга» (правый верхний угол). Без иконки —
  // в духе дизайн-системы (CLAUDE.md §7).
  const accountActive = pathname.startsWith("/dashboard");
  const accountButton = user ? (
    <Link
      href="/dashboard/recipes"
      aria-label={t("myBook")}
      className={cn(
        "rounded-none border px-2.5 py-1 font-body text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors",
        accountActive
          ? "border-burg text-burg"
          : "border-rule text-soft hover:border-burg hover:text-burg",
      )}
    >
      {t("myBook")}
    </Link>
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
              accountButton
            ) : (
              <Link href="/login" className="text-burg transition-colors hover:text-ochre-dk">
                {t("signIn")} &rarr;
              </Link>
            )}
          </span>
        </div>

        {/* Masthead row — только логотип по центру (боковые подписи убраны,
            чтобы не рассеивать внимание на главном экране). */}
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

        {/* Nav row — sticky. В кабинете «← На сайт» прижимаем влево (привычный
            паттерн возврата), на публичных страницах меню по центру. */}
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

      </div>

      {/* ─── Mobile nav drawer (<md) — выезжает справа, затемняет фон ─────── */}
      <div
        className={cn(
          "fixed inset-0 z-[60] md:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
        aria-hidden={!mobileOpen}
      >
        {/* Затемнение фона — клик закрывает */}
        <div
          onClick={() => setMobileOpen(false)}
          className={cn(
            "absolute inset-0 bg-ink/40 transition-opacity duration-300",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
        />

        {/* Панель */}
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
              // Вход в кабинет. Тариф и «Выйти» — внутри, на вкладке «Аккаунт».
              <Link
                href="/dashboard/recipes"
                className={cn(
                  "flex min-h-[48px] items-center font-body text-[13px] uppercase tracking-[0.16em] transition-colors",
                  accountActive ? "font-bold text-burg" : "font-medium text-soft hover:text-burg",
                )}
              >
                {t("myBook")}
              </Link>
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

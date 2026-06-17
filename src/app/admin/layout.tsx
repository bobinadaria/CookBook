"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import ThemeToggle from "@/components/layout/ThemeToggle";

const navLinks = [
  { href: "/admin/recipes", label: "Рецепты" },
  { href: "/admin/categories", label: "Категории" },
  { href: "/admin/ingredient-requests", label: "Запросы" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/login"); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") { router.replace("/"); return; }
      setChecking(false);
    });
  }, [router]);

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center">
        <span className="font-display italic text-2xl text-muted">Проверка доступа...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-paper/90 backdrop-blur-sm border-b border-rule">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 md:h-16 md:px-8 md:py-0">
          {/* Logo */}
          <Link
            href="/"
            className="shrink-0 whitespace-nowrap font-display italic text-xl text-ink transition-colors hover:text-ochre-dk md:text-2xl"
          >
            The Slow Table
          </Link>

          {/* Admin nav — на мобиле уходит на отдельную строку */}
          <nav className="order-last flex w-full items-center gap-5 md:order-none md:w-auto md:gap-8">
            {navLinks.map(({ href, label }) => {
              const active = pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-ochre-dk",
                    active ? "text-ochre-dk" : "text-soft"
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-2 md:gap-3">
            <ThemeToggle />
            <LanguageSwitcher />
            <Link
              href="/"
              className="hidden text-sm font-medium text-soft transition-colors hover:text-burg sm:inline-block"
            >
              ← На сайт
            </Link>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="text-sm font-medium bg-burg text-paper px-4 py-2 rounded-none hover:bg-burg-dk transition-colors disabled:opacity-50"
            >
              {signingOut ? "..." : "Выйти"}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto w-full max-w-4xl flex-1 p-6 md:p-10">
        {children}
      </main>
    </div>
  );
}

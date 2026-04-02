"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import LanguageSwitcher from "@/components/layout/LanguageSwitcher";
import ThemeToggle from "@/components/layout/ThemeToggle";

const navLinks = [
  { href: "/admin", label: "Обзор", exact: true },
  { href: "/admin/recipes", label: "Рецепты" },
  { href: "/admin/categories", label: "Категории" },
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
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <span className="font-handwritten text-2xl text-charcoal/30">Проверка доступа...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-cream/90 backdrop-blur-sm border-b border-sand">
        <div className="px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link
            href="/"
            className="font-handwritten text-2xl text-charcoal hover:text-peach transition-colors"
          >
            CookBook
          </Link>

          {/* Admin nav */}
          <nav className="flex items-center gap-8">
            {navLinks.map(({ href, label, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-peach",
                    active ? "text-peach" : "text-charcoal/60"
                  )}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageSwitcher />
            <Link
              href="/"
              className="text-sm font-medium text-charcoal/50 hover:text-charcoal transition-colors"
            >
              ← На сайт
            </Link>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="text-sm font-medium bg-peach text-white px-4 py-2 rounded-full hover:bg-peach-dark transition-colors disabled:opacity-50"
            >
              {signingOut ? "..." : "Выйти"}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 pt-16 p-10 max-w-4xl w-full mx-auto">
        {children}
      </main>
    </div>
  );
}

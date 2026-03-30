"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/admin", label: "Обзор", exact: true },
  { href: "/admin/recipes", label: "Рецепты" },
  { href: "/admin/categories", label: "Категории" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace("/login"); return; }

      // Check admin role in profiles table
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profile?.role !== "admin") {
        router.replace("/");
        return;
      }
      setChecking(false);
    });
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <span className="font-handwritten text-2xl text-charcoal/30">Проверка доступа...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-sand flex flex-col py-8 px-5">
        <Link href="/" className="font-handwritten text-2xl text-charcoal hover:text-peach transition-colors mb-10 block">
          CookBook
        </Link>

        <nav className="flex flex-col gap-1">
          {navLinks.map(({ href, label, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                  active
                    ? "bg-sand text-charcoal"
                    : "text-charcoal/50 hover:text-charcoal hover:bg-sand/60"
                )}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto">
          <Link href="/" className="text-xs text-charcoal/30 hover:text-peach transition-colors">
            ← На сайт
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-10 max-w-4xl">
        {children}
      </main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { createClient } from "@/lib/supabase/client";
import LanguageSwitcher from "./LanguageSwitcher";
import type { User } from "@supabase/supabase-js";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("nav");
  const { direction, scrollY } = useScrollDirection();
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  const visible = scrollY < 80 || direction === "up";

  const navLinks = [
    { href: "/recipes", label: t("recipes") },
    { href: "/dashboard/favorites", label: t("favorites") },
  ];

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      setUser(data.user);
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();
        setIsAdmin(profile?.role === "admin");
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) setIsAdmin(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50",
        "bg-cream/90 backdrop-blur-sm border-b border-sand",
        "transition-transform duration-300 ease-in-out",
        visible ? "translate-y-0" : "-translate-y-full"
      )}
    >
      <div className="px-8 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="font-handwritten text-2xl text-charcoal hover:text-peach transition-colors"
        >
          CookBook
        </Link>

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

        <div className="flex items-center gap-3">
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
              <span className="hidden sm:block text-sm text-charcoal/40 max-w-[140px] truncate">
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
      </div>
    </header>
  );
}

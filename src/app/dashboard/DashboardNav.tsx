"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/dashboard", key: "navHome" },
  { href: "/dashboard/favorites", key: "navFavorites" },
  { href: "/dashboard/notes", key: "navNotes" },
] as const;

export default function DashboardNav() {
  const t = useTranslations("dashboard");
  const pathname = usePathname();

  return (
    <nav className="px-6 pt-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 flex-wrap">
        {ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-colors border",
                active
                  ? "bg-charcoal text-cream border-charcoal"
                  : "bg-transparent text-charcoal/60 border-charcoal/15 hover:border-charcoal/35 hover:text-charcoal",
              )}
            >
              {t(item.key)}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

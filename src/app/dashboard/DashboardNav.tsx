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
    <nav className="mx-auto max-w-5xl px-6 pt-6">
      <div className="flex flex-wrap items-center gap-2">
        {ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-none border px-4 py-2 font-body text-[12px] font-semibold uppercase tracking-[0.12em] transition-colors",
                active
                  ? "border-burg bg-burg text-paper"
                  : "border-rule bg-transparent text-soft hover:border-burg hover:text-burg",
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

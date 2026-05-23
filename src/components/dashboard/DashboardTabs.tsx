"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/**
 * Навигация внутри «Моей книги»: переключение между списком рецептов и
 * аккаунтом. «Подписка» живёт разделом внутри «Аккаунта» (см. dashboard/page.tsx).
 * Список рецептов сохраняет свои внутренние фильтры (Все / Мои / Сохранённые).
 */
export default function DashboardTabs() {
  const pathname = usePathname();
  const t = useTranslations("dashboard");

  const tabs = [
    {
      href: "/dashboard/recipes",
      label: t("tabRecipes"),
      active: pathname.startsWith("/dashboard/recipes"),
    },
    {
      href: "/dashboard",
      label: t("tabAccount"),
      active: pathname === "/dashboard",
    },
  ];

  return (
    <nav className="mx-auto max-w-[1320px] px-6 pt-8 md:px-10 lg:px-14">
      <div className="flex flex-wrap gap-2 border-b border-rule pb-4">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-none border px-4 py-2 font-body text-[12px] font-semibold uppercase tracking-[0.12em] transition-colors",
              tab.active
                ? "border-burg bg-burg text-paper"
                : "border-rule bg-transparent text-soft hover:border-burg hover:text-burg",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

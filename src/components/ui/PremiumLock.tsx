"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Единый паттерн «Premium-тизер» (см. docs/RECIPE_IMPORT_AND_PREMIUM_TEASERS_PLAN.md §3).
 *
 * Раньше AI-фичи (ссылка/AI-обложка/AI-КБЖУ) просто не рендерились для Free
 * (`{aiEnabled && (...)}`) — человек не видел, чего лишён. Теперь структура
 * видна всем, а при `locked=true` реальные контролы внутри неактивны
 * (`inert` — не только клики, но и фокус/таб), затемнены, и сверху —
 * кликабельный бейдж-ссылка на `/pricing`. При `locked=false` рендерит
 * children как есть, без изменений.
 */
export default function PremiumLock({
  locked,
  children,
  className,
}: {
  locked: boolean;
  children: ReactNode;
  className?: string;
}) {
  const t = useTranslations("myRecipes");

  if (!locked) return <>{children}</>;

  return (
    <div className={cn("relative", className)}>
      <div inert className="pointer-events-none select-none opacity-50">
        {children}
      </div>
      <Link
        href="/pricing"
        className="absolute right-3 top-3 z-10 rounded-none bg-ochre-dk px-2.5 py-1 font-body text-[10px] font-semibold uppercase tracking-[0.12em] text-paper transition-colors hover:bg-burg"
      >
        {t("premiumLockBadge")}
      </Link>
    </div>
  );
}

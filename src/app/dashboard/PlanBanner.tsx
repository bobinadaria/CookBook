"use client";

import { useTranslations } from "next-intl";
import { Eyebrow } from "@/components/ui";

/**
 * Баннер плана и кредитов в шапке кабинета.
 *
 * СЕЙЧАС — каркас: показывает Free + приветственный набор (10 КБЖУ / 5 рецептов
 * из бизнес-плана) + тизер Premium с пометкой «скоро». Реальные счётчики
 * остатка и рабочий апгрейд через Paddle подключим, когда будет credits-система
 * (по плану — месяц 8-10). Тогда значения станут динамическими, а CTA — рабочей.
 */
const WELCOME_KBJU = 10;
const WELCOME_RECIPES = 5;

export default function PlanBanner() {
  const t = useTranslations("dashboard");

  return (
    <div className="mb-8 bg-crust p-6 md:p-7">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        {/* Текущий план + кредиты */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Eyebrow color="text-soft">{t("planTitle")}</Eyebrow>
            <span className="rounded-none bg-burg px-2.5 py-0.5 font-body text-[10px] font-semibold uppercase tracking-[0.12em] text-paper">
              {t("planFree")}
            </span>
          </div>
          <div className="flex gap-8">
            <div>
              <p className="font-display text-3xl leading-none text-burg">{WELCOME_KBJU}</p>
              <p className="mt-1 font-body text-xs text-soft">{t("creditKbju")}</p>
            </div>
            <div>
              <p className="font-display text-3xl leading-none text-burg">{WELCOME_RECIPES}</p>
              <p className="mt-1 font-body text-xs text-soft">{t("creditRecipes")}</p>
            </div>
          </div>
          <p className="mt-3 font-body text-xs text-muted">{t("creditsCaption")}</p>
        </div>

        {/* Тизер Premium */}
        <div className="border border-ochre/30 bg-paper p-5 md:max-w-xs">
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="font-display text-xl text-burg">{t("premiumTitle")}</span>
            <span className="font-body text-sm font-semibold text-ochre-dk">{t("premiumPrice")}</span>
          </div>
          <p className="mb-4 font-body text-xs leading-relaxed text-soft">{t("premiumDesc")}</p>
          <button
            type="button"
            disabled
            className="inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-none bg-ochre/15 px-4 py-2.5 font-body text-[12px] font-semibold uppercase tracking-[0.12em] text-ochre-dk"
          >
            {t("premiumCta")}
            <span className="rounded-none bg-ochre/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
              {t("premiumSoon")}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

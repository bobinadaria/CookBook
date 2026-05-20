"use client";

import { useTranslations } from "next-intl";

/**
 * Баннер плана и кредитов в шапке кабинета.
 *
 * СЕЙЧАС — каркас: показывает Free + приветственный набор (10 КБЖУ / 5 рецептов
 * из бизнес-плана) + тизер Premium с пометкой «скоро». Реальные счётчики
 * остатка и рабочий апгрейд через Paddle подключим, когда будет credits-система
 * (по плану — месяц 8-10). Тогда значения станут динамическими, а CTA — рабочей.
 *
 * Стратегическая роль (по бизнес-плану): кабинет — место, где видна фримиум-
 * экономика и происходит конверсия в Premium.
 */
const WELCOME_KBJU = 10;
const WELCOME_RECIPES = 5;

export default function PlanBanner() {
  const t = useTranslations("dashboard");

  return (
    <div className="bg-sand/60 rounded-card p-6 md:p-7 mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
        {/* Текущий план + кредиты */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[11px] uppercase tracking-widest text-charcoal/40">
              {t("planTitle")}
            </span>
            <span className="text-xs font-medium bg-charcoal text-cream px-2.5 py-0.5 rounded-full">
              {t("planFree")}
            </span>
          </div>
          <div className="flex gap-8">
            <div>
              <p className="font-serif text-2xl text-charcoal leading-none">{WELCOME_KBJU}</p>
              <p className="text-xs text-charcoal/45 mt-1">{t("creditKbju")}</p>
            </div>
            <div>
              <p className="font-serif text-2xl text-charcoal leading-none">{WELCOME_RECIPES}</p>
              <p className="text-xs text-charcoal/45 mt-1">{t("creditRecipes")}</p>
            </div>
          </div>
          <p className="text-xs text-charcoal/30 mt-3">{t("creditsCaption")}</p>
        </div>

        {/* Тизер Premium */}
        <div className="bg-cream rounded-2xl p-5 border border-peach/20 md:max-w-xs">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="font-serif text-lg text-charcoal">{t("premiumTitle")}</span>
            <span className="text-sm text-peach font-medium">{t("premiumPrice")}</span>
          </div>
          <p className="text-xs text-charcoal/55 leading-relaxed mb-4">{t("premiumDesc")}</p>
          <button
            type="button"
            disabled
            className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-peach/15 text-peach text-sm font-medium px-4 py-2.5 cursor-not-allowed"
          >
            {t("premiumCta")}
            <span className="text-[10px] uppercase tracking-wider bg-peach/20 px-1.5 py-0.5 rounded-full">
              {t("premiumSoon")}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

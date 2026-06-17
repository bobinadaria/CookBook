"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Eyebrow } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Карточка плана в колонке «Аккаунта».
 *
 * Показывает РЕАЛЬНЫЙ план пользователя (`plan`, читается из profiles.plan на
 * странице аккаунта). Для Free — каркас: приветственный набор (10 КБЖУ / 5
 * рецептов) + тизер Premium с пометкой «скоро». Для Premium/Lifetime — состояние
 * «доступ открыт» без тизера апгрейда. Реальные счётчики остатка и рабочий
 * апгрейд через Paddle подключим, когда будет credits-система (см.
 * docs/MONETIZATION_PLAN.md). Тогда значения станут динамическими, а CTA — рабочей.
 *
 * «Сравнить планы» — прямая ссылка на отдельную страницу `/pricing` (полное
 * сравнение тарифов, FAQ, CTA). Inline-сравнение убрано: вся детальная
 * информация о планах живёт в одном месте, чтобы не дублировать и не расходиться.
 */
const WELCOME_KBJU = 10;
const WELCOME_RECIPES = 5;

type Plan = "free" | "premium" | "lifetime";

export default function PlanBanner({ plan = "free" }: { plan?: Plan }) {
  const t = useTranslations("dashboard");

  const isPaid = plan === "premium" || plan === "lifetime";
  const planLabel =
    plan === "premium" ? t("planPremium") : plan === "lifetime" ? t("planLifetime") : t("planFree");

  return (
    <section className="bg-crust p-6 md:p-7">
      {/* Текущий план + бейдж */}
      <div className="mb-4 flex items-center gap-2">
        <Eyebrow color="text-ochre-dk">{t("planTitle")}</Eyebrow>
        <span
          className={cn(
            "rounded-none px-2.5 py-0.5 font-body text-[10px] font-semibold uppercase tracking-[0.12em]",
            isPaid ? "bg-ochre-dk text-paper" : "bg-burg text-paper",
          )}
        >
          {planLabel}
        </span>
      </div>

      {isPaid ? (
        /* Premium/Lifetime — доступ открыт, без тизера апгрейда. */
        <div>
          <p className="font-display text-3xl leading-none text-burg">{t("planActiveTitle")}</p>
          <p className="mt-2 font-body text-sm leading-relaxed text-soft">{t("premiumDesc")}</p>
        </div>
      ) : (
        <>
          {/* Кредиты приветственного набора (Free) */}
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

          {/* Тизер Premium (компактный) */}
          <div className="mt-6 border border-ochre/30 bg-paper p-5">
            <div className="mb-1.5 flex items-baseline justify-between">
              <span className="font-display text-xl text-burg">{t("premiumTitle")}</span>
              <span className="font-body text-sm font-semibold text-ochre-dk">
                {t("premiumPrice")}
              </span>
            </div>
            <p className="mb-4 font-body text-xs leading-relaxed text-soft">{t("premiumDesc")}</p>
            <button
              type="button"
              disabled
              className="inline-flex cursor-not-allowed items-center justify-center gap-2 rounded-none bg-ochre/15 px-4 py-2.5 font-body text-[12px] font-semibold uppercase tracking-[0.12em] text-ochre-dk"
            >
              {t("premiumCta")}
              <span className="rounded-none bg-ochre/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
                {t("premiumSoon")}
              </span>
            </button>
          </div>
        </>
      )}

      {/* Сравнить планы — прямая ссылка на отдельную страницу тарифов. */}
      <div className="mt-6 border-t border-rule pt-4">
        <Link
          href="/pricing"
          className="font-body text-[12px] font-semibold uppercase tracking-[0.12em] text-burg transition-colors hover:text-ochre-dk"
        >
          {t("compareShow")} &rarr;
        </Link>
      </div>
    </section>
  );
}

"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Eyebrow } from "@/components/ui";

/**
 * Карточка плана в колонке «Аккаунта».
 *
 * СЕЙЧАС — каркас: показывает Free + приветственный набор (10 КБЖУ / 5 рецептов
 * из бизнес-плана) + тизер Premium с пометкой «скоро». Реальные счётчики
 * остатка и рабочий апгрейд через Paddle подключим, когда будет credits-система
 * (по плану — месяц 8-10). Тогда значения станут динамическими, а CTA — рабочей.
 *
 * Кнопка «Сравнить планы» (View more) раскрывает полное сравнение Free/Premium
 * прямо здесь. Данные сравнения берём из тех же строк, что и страница `/pricing`
 * (неймспейс `pricing.tiers`), чтобы не дублировать и не расходиться по фичам.
 */
const WELCOME_KBJU = 10;
const WELCOME_RECIPES = 5;

type FeatureValue = boolean | string;
interface PricingTier {
  key: string;
  features: [string, FeatureValue][];
}

export default function PlanBanner() {
  const t = useTranslations("dashboard");
  const tp = useTranslations("pricing");
  const [open, setOpen] = useState(false);

  const tiers = tp.raw("tiers") as PricingTier[];
  const free = tiers?.find((x) => x.key === "free");
  const premium = tiers?.find((x) => x.key === "premium");
  const rows =
    free && premium
      ? free.features.map((f, i) => ({
          label: f[0],
          free: f[1],
          premium: premium.features[i]?.[1] ?? false,
        }))
      : [];

  const renderVal = (v: FeatureValue) => {
    if (v === true) return <span className="text-olive">●</span>;
    if (v === false) return <span className="text-muted">—</span>;
    return <span className="text-ink">{v}</span>;
  };

  return (
    <section className="bg-crust p-6 md:p-7">
      {/* Текущий план + бейдж */}
      <div className="mb-4 flex items-center gap-2">
        <Eyebrow color="text-ochre-dk">{t("planTitle")}</Eyebrow>
        <span className="rounded-none bg-burg px-2.5 py-0.5 font-body text-[10px] font-semibold uppercase tracking-[0.12em] text-paper">
          {t("planFree")}
        </span>
      </div>

      {/* Кредиты приветственного набора */}
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
          <span className="font-body text-sm font-semibold text-ochre-dk">{t("premiumPrice")}</span>
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

      {/* Сравнение планов — раскрывается по «View more» */}
      {rows.length > 0 && (
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="font-body text-[12px] font-semibold uppercase tracking-[0.12em] text-burg transition-colors hover:text-ochre-dk"
          >
            {open ? t("compareHide") : t("compareShow")} {open ? "↑" : "↓"}
          </button>

          {open && (
            <div className="mt-4 border-t border-rule pt-4">
              <div className="grid grid-cols-[1.4fr_1fr_1fr] items-center gap-x-3 gap-y-2.5">
                {/* Шапка сравнения */}
                <span />
                <span className="text-right font-body text-[10px] font-semibold uppercase tracking-[0.1em] text-soft">
                  {t("planFree")}
                </span>
                <span className="text-right font-body text-[10px] font-semibold uppercase tracking-[0.1em] text-ochre-dk">
                  {t("premiumTitle")}
                </span>

                {rows.map((r, i) => (
                  <Fragment key={i}>
                    <span className="font-body text-[11px] leading-tight text-ink">{r.label}</span>
                    <span className="text-right font-body text-[11px] leading-tight">{renderVal(r.free)}</span>
                    <span className="text-right font-body text-[11px] leading-tight">{renderVal(r.premium)}</span>
                  </Fragment>
                ))}
              </div>

              <Link
                href="/pricing"
                className="mt-5 inline-block font-body text-[12px] font-medium text-burg transition-colors hover:text-ochre-dk"
              >
                {t("subscribeCta")} &rarr;
              </Link>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

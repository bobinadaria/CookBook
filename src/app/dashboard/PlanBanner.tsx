"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Eyebrow } from "@/components/ui";
import { cn } from "@/lib/utils";

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
        /* Premium/Lifetime — доступ открыт */
        <div>
          <p className="font-display text-3xl leading-none text-burg">{t("planActiveTitle")}</p>
          <p className="mt-2 font-body text-sm leading-relaxed text-soft">{t("premiumDesc")}</p>
        </div>
      ) : (
        /* Free — краткое описание + CTA на /pricing */
        <div>
          <p className="font-body text-sm leading-relaxed text-soft">{t("freeDesc")}</p>
          <Link
            href="/pricing#plans"
            className="mt-4 inline-flex items-center gap-1.5 rounded-none border-[1.5px] border-burg px-4 py-2.5 font-body text-[12px] font-semibold uppercase tracking-[0.12em] text-burg transition-colors hover:bg-burg hover:text-paper"
          >
            {t("compareShow")} →
          </Link>
        </div>
      )}

    </section>
  );
}

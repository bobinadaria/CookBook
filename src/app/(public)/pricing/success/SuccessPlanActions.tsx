"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import CreateRecipeButton from "@/components/dashboard/CreateRecipeButton";

/**
 * CTA-кнопки для success-страницы после оплаты Premium/Lifetime.
 * Клиентский компонент — нужен, чтобы использовать CreateRecipeButton (открывает модалку).
 */
export default function SuccessPlanActions({ aiEnabled }: { aiEnabled: boolean }) {
  const t = useTranslations("pricing.success");

  return (
    <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
      <CreateRecipeButton
        aiEnabled={aiEnabled}
        label={t("ctaAddRecipe")}
        className="border-[1.5px] border-ochre bg-ochre px-8 py-4 font-body text-[12px] font-semibold uppercase tracking-[0.15em] text-seal transition-colors hover:bg-ochre-dk"
      />
      <Link
        href="/pricing#covers"
        className="border-[1.5px] border-burg/50 px-8 py-4 font-body text-[12px] font-semibold uppercase tracking-[0.15em] text-burg transition-colors hover:bg-burg hover:text-paper"
      >
        {t("ctaBuyPacks")}
      </Link>
    </div>
  );
}

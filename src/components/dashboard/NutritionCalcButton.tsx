"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { EditorialButton } from "@/components/ui";

/**
 * Кнопка расчёта КБЖУ для пользовательского рецепта. Показывается только для
 * AI-доступных аккаунтов (гейт — на сервере в /api/recipes/calculate-nutrition).
 * После успеха обновляет страницу (router.refresh), чтобы серверный блок
 * NutritionFacts перерисовался с новыми цифрами.
 */
export default function NutritionCalcButton({
  recipeId,
  hasNutrition = false,
}: {
  recipeId: string;
  hasNutrition?: boolean;
}) {
  const t = useTranslations("myRecipes");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCalc = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/recipes/calculate-nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // force при пересчёте — игнорировать кеш и посчитать заново.
        body: JSON.stringify({ recipeId, force: hasNutrition }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || t("nutritionError"));
        return;
      }
      router.refresh();
    } catch {
      setError(t("nutritionError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <EditorialButton
        type="button"
        variant="ghost"
        onClick={handleCalc}
        disabled={loading}
        className="px-6 py-3"
      >
        {loading
          ? t("nutritionCalculating")
          : hasNutrition
            ? t("nutritionRecalc")
            : t("nutritionCalc")}
      </EditorialButton>
      {error && <span className="text-sm text-red-500">{error}</span>}
    </div>
  );
}

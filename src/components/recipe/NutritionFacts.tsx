import { getTranslations } from "next-intl/server";
import type { NutritionData } from "@/types";

/**
 * Публичный блок «Пищевая ценность» на странице рецепта.
 *
 * ВАЖНО: показывает ТОЛЬКО чистые цифры (ккал/Б/Ж/У на порцию).
 * Никакой диагностики — confidence, warnings, fuzzy-пометки, разбор по
 * ингредиентам остаются ИСКЛЮЧИТЕЛЬНО в админке (NutritionSection).
 * Решение Дарьи: «админ видит как считалось, пользователь видит только результат».
 */
export default async function NutritionFacts({
  nutrition,
}: {
  nutrition: NutritionData | null | undefined;
}) {
  if (!nutrition?.per_serving) return null;

  const t = await getTranslations("recipe.nutrition");
  const { kcal, protein, fat, carbs } = nutrition.per_serving;

  const stats: { label: string; value: number; unit: string; big?: boolean }[] = [
    { label: t("kcal"), value: kcal, unit: "", big: true },
    { label: t("protein"), value: protein, unit: t("gram") },
    { label: t("fat"), value: fat, unit: t("gram") },
    { label: t("carbs"), value: carbs, unit: t("gram") },
  ];

  return (
    <section className="px-6 pb-14 max-w-5xl mx-auto">
      <div className="bg-sand/60 rounded-card p-6 md:p-8">
        <div className="flex items-baseline justify-between mb-6 flex-wrap gap-2">
          <h2 className="font-serif text-2xl md:text-3xl text-charcoal">
            {t("title")}
          </h2>
          <span className="text-sm text-charcoal/50">{t("perServing")}</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-6">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col">
              <span className="text-[11px] uppercase tracking-widest text-charcoal/40 mb-1">
                {s.label}
              </span>
              <span
                className={
                  s.big
                    ? "font-serif text-4xl md:text-5xl text-charcoal leading-none"
                    : "font-serif text-2xl md:text-3xl text-charcoal leading-none"
                }
              >
                {s.value}
                {s.unit && (
                  <span className="text-sm font-sans text-charcoal/40 ml-1">
                    {s.unit}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>

        <p className="text-xs text-charcoal/30 mt-6">{t("approximate")}</p>
      </div>
    </section>
  );
}

import { getTranslations } from "next-intl/server";
import { Eyebrow } from "@/components/ui";
import type { NutritionData } from "@/types";

/**
 * Публичный блок «Пищевая ценность» (КБЖУ) на странице рецепта — magazine-стиль.
 *
 * ВАЖНО: показывает ТОЛЬКО чистые цифры (ккал/Б/Ж/У на порцию) + долю от
 * суточной нормы. Никакой диагностики (confidence, warnings, разбор по
 * ингредиентам) — она остаётся ИСКЛЮЧИТЕЛЬНО в админке.
 *
 * Проценты считаются от референсных суточных норм ЕС (Reference Intakes):
 * энергия 2000 ккал, белки 50 г, жиры 70 г, углеводы 260 г.
 */
const DAILY_VALUE = { kcal: 2000, protein: 50, fat: 70, carbs: 260 };

export default async function NutritionFacts({
  nutrition,
}: {
  nutrition: NutritionData | null | undefined;
}) {
  if (!nutrition?.per_serving) return null;

  const t = await getTranslations("recipe.nutrition");
  const { kcal, protein, fat, carbs } = nutrition.per_serving;

  const pct = (value: number, dv: number) => (dv > 0 ? Math.round((value / dv) * 100) : 0);
  const kcalPct = pct(kcal, DAILY_VALUE.kcal);

  const macros = [
    { label: t("protein"), value: protein, p: pct(protein, DAILY_VALUE.protein) },
    { label: t("fat"), value: fat, p: pct(fat, DAILY_VALUE.fat) },
    { label: t("carbs"), value: carbs, p: pct(carbs, DAILY_VALUE.carbs) },
  ];

  return (
    <section className="mx-auto max-w-[1320px] px-6 pb-20 md:px-10 lg:px-14">
      <div className="grid items-center gap-10 bg-section px-6 py-12 text-section-fg md:px-14 lg:grid-cols-[1fr_1.4fr] lg:gap-14">
        {/* Left — heading + method note */}
        <div>
          <Eyebrow color="text-ochre">{t("title")}</Eyebrow>
          <h2 className="mb-4 mt-3 font-display text-[48px] font-normal italic leading-[0.9] tracking-[-0.02em] text-section-fg sm:text-[64px]">
            {t("perServingTitle")}
          </h2>
          <p className="max-w-[360px] font-body text-[14px] leading-[1.7] text-section-soft">
            {t("method")}
          </p>
          <p className="mt-6 max-w-[360px] font-body text-[10px] font-semibold uppercase leading-[1.7] tracking-[0.16em] text-section-soft">
            ※ {t("approximate")}
          </p>
        </div>

        {/* Right — big kcal + macros */}
        <div>
          <div className="flex items-baseline gap-4 border-b border-section-rule pb-5">
            <span className="font-display text-[80px] font-normal italic leading-[0.9] tracking-[-0.03em] text-ochre sm:text-[120px]">
              {kcal}
            </span>
            <span className="font-body text-[12px] font-semibold uppercase tracking-[0.14em] text-section-fg/80">
              {t("kcal")} · {kcalPct}% {t("dailyValue")}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-3 gap-5 sm:gap-6">
            {macros.map((m) => (
              <div key={m.label}>
                <Eyebrow color="text-section-fg/65">{m.label}</Eyebrow>
                <div className="mt-2">
                  <span className="font-display text-[36px] font-normal leading-none text-section-fg sm:text-[48px]">
                    {m.value}
                  </span>
                  <span className="ml-1.5 font-body text-[11px] font-semibold tracking-[0.08em] text-section-fg/65">
                    {t("gram")}
                  </span>
                </div>
                <div className="mt-2 h-1 bg-section-fg/15">
                  <div className="h-full bg-ochre" style={{ width: `${Math.min(100, m.p)}%` }} />
                </div>
                <div className="mt-1.5 font-body text-[10px] font-semibold tracking-[0.13em] text-section-fg/60">
                  {m.p}% {t("ofTarget")}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

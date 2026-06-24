import { getTranslations } from "next-intl/server";
import { Eyebrow } from "@/components/ui";
import CreateRecipeButton from "./CreateRecipeButton";

/**
 * Пустое состояние «Моей книги» — не грустная коробка, а приглашение к магии.
 * Слева — тёплое вступление, две «суперсилы» (импорт по ссылке + AI-КБЖУ) и CTA.
 * Справа — пример того, во что превратится первый рецепт (показ, а не рассказ).
 */
export default async function MyBookEmptyState({
  aiEnabled = false,
}: {
  /** Доступ к AI-фичам (premium/lifetime) — решает, заперт ли режим «Ссылка» в модалке. */
  aiEnabled?: boolean;
}) {
  const t = await getTranslations("myRecipes");

  const magics = [
    { title: t("emptyMagic1Title"), body: t("emptyMagic1Body") },
    { title: t("emptyMagic2Title"), body: t("emptyMagic2Body") },
  ];

  return (
    <div className="border-t border-rule py-14 md:py-20">
      <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
        {/* Приглашение */}
        <div>
          <Eyebrow color="text-ochre-dk">{t("emptyEyebrow")}</Eyebrow>
          <h2 className="mt-4 font-display text-[clamp(2.5rem,5vw,56px)] font-normal leading-[0.95] tracking-[-0.02em] text-burg">
            {t("emptyHeadline1")} <em className="italic text-ochre">{t("emptyHeadline2")}</em>
          </h2>
          <p className="mt-5 max-w-[480px] font-reader text-[17px] leading-[1.7] text-ink">
            {t("emptyLede")}
          </p>
          <p className="mt-2 font-body text-[12px] font-semibold uppercase tracking-[0.13em] text-ochre-dk">
            {t("emptyPrivacyNote")}
          </p>

          <div className="mt-8 space-y-5 border-t border-rule pt-7">
            {magics.map((m) => (
              <div key={m.title} className="flex gap-4">
                <span className="mt-0.5 font-display text-[26px] italic leading-none text-ochre">&rarr;</span>
                <div>
                  <div className="font-body text-[12px] font-semibold uppercase tracking-[0.14em] text-burg">
                    {m.title}
                  </div>
                  <p className="mt-1.5 max-w-[440px] font-body text-[13px] leading-[1.6] text-soft">
                    {m.body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-9">
            <CreateRecipeButton className="px-7 py-3.5" aiEnabled={aiEnabled} />
          </div>
        </div>

        {/* Пример страницы — показ результата */}
        <div className="bg-crust p-7 md:p-9">
          <Eyebrow color="text-ochre-dk">{t("emptyPreviewLabel")}</Eyebrow>
          <div className="mt-5 flex items-baseline gap-4">
            <span className="font-display text-[44px] font-normal italic leading-[0.9] text-ochre">I</span>
            <h3 className="font-display text-[24px] font-normal leading-[1.1] text-ink sm:text-[28px]">
              {t("emptyPreviewTitle")}
            </h3>
          </div>

          {/* КБЖУ-полоска — как на странице рецепта */}
          <div className="mt-6 bg-section px-6 py-6 text-section-fg">
            <Eyebrow color="text-ochre">{t("emptyPreviewNutritionLabel")}</Eyebrow>
            <div className="mt-2 flex items-baseline gap-3 border-b border-section-rule pb-4">
              <span className="font-display text-[56px] font-normal italic leading-none text-ochre">175</span>
              <span className="font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-section-fg/80">
                {t("emptyPreviewKcal")}
              </span>
            </div>
            <div className="mt-4 font-body text-[12px] font-semibold uppercase tracking-[0.13em] text-section-soft">
              {t("emptyPreviewMacros")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

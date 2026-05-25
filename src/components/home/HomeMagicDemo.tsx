"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Eyebrow, EditorialButton } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * HomeMagicDemo — автоплей-«ролик» на лендинге, показывающий главный вау-момент:
 * вставил ссылку → заполнились поля → посчиталось точное КБЖУ → проявилась обложка.
 *
 * Это НЕ живой вызов AI: всё проигрывается по таймлайну на одном примере
 * (круассан с бри и сливой — то же блюдо, что на обложке номера, 425 ккал).
 * Значит: ноль расходов OpenAI и ноль поверхности для злоупотреблений, а финальная
 * картинка (`/demo-cover.jpg`) — настоящая. Уважает prefers-reduced-motion.
 */

// КБЖУ согласованы с подписью на обложке номера (425 ккал / порцию).
const KCAL = 425;
const MACROS = { protein: 13, fat: 26, carbs: 35 } as const;

export default function HomeMagicDemo() {
  const t = useTranslations("home");
  const url = t("demoUrl");
  const ingredients = t.raw("demoIngredients") as string[];
  const ingCount = ingredients.length;

  const [cycle, setCycle] = useState(0);
  const [reduced, setReduced] = useState(false);

  const [typedLen, setTypedLen] = useState(0);
  const [importing, setImporting] = useState(false);
  const [showFields, setShowFields] = useState(false);
  const [revealedIng, setRevealedIng] = useState(0);
  const [showNutrition, setShowNutrition] = useState(false);
  const [kcalShown, setKcalShown] = useState(0);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [imageReady, setImageReady] = useState(false);

  const replay = useCallback(() => setCycle((c) => c + 1), []);

  // Определяем prefers-reduced-motion после маунта (без рассинхрона гидрации).
  useEffect(() => {
    setReduced(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
  }, []);

  // Оркестратор таймлайна. Перезапускается на каждый cycle и при смене reduced.
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  useEffect(() => {
    const timers = timersRef.current;
    const clearAll = () => {
      timers.forEach(clearTimeout);
      timers.length = 0;
    };
    clearAll();

    // Reduced motion: показываем сразу финальное состояние, без анимации и без петли.
    if (reduced) {
      setTypedLen(url.length);
      setImporting(false);
      setShowFields(true);
      setRevealedIng(ingCount);
      setShowNutrition(true);
      setKcalShown(KCAL);
      setGeneratingImage(false);
      setImageReady(true);
      return clearAll;
    }

    // Старт цикла — сбрасываем всё.
    setTypedLen(0);
    setImporting(false);
    setShowFields(false);
    setRevealedIng(0);
    setShowNutrition(false);
    setKcalShown(0);
    setGeneratingImage(false);
    setImageReady(false);

    const at = (ms: number, fn: () => void) => timers.push(setTimeout(fn, ms));

    // 1) Печатается URL (по символу).
    const charMs = 45;
    for (let i = 1; i <= url.length; i++) at(i * charMs, () => setTypedLen(i));
    const tType = url.length * charMs;

    // 2) «Импортирую…»
    at(tType + 250, () => setImporting(true));

    // 3) Заполняются поля: заголовок + состав по строкам.
    const tFields = tType + 950;
    at(tFields, () => {
      setImporting(false);
      setShowFields(true);
    });
    for (let i = 1; i <= ingCount; i++) at(tFields + i * 160, () => setRevealedIng(i));
    const tFieldsDone = tFields + ingCount * 160;

    // 4) Считается КБЖУ (число «набегает»).
    const tNutri = tFieldsDone + 250;
    at(tNutri, () => setShowNutrition(true));
    const countSteps = 22;
    for (let s = 1; s <= countSteps; s++) {
      at(tNutri + (s * 800) / countSteps, () =>
        setKcalShown(Math.round((KCAL * s) / countSteps)),
      );
    }

    // 5) Генерируется обложка → проявляется реальное фото.
    const tImg = tNutri + 1050;
    at(tImg, () => setGeneratingImage(true));
    at(tImg + 900, () => {
      setGeneratingImage(false);
      setImageReady(true);
    });

    // 6) Пауза и петля.
    at(tImg + 900 + 2800, () => setCycle((c) => c + 1));

    return clearAll;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cycle, reduced]);

  const typedUrl = url.slice(0, typedLen);
  const typing = typedLen < url.length;
  const macros = [
    { label: t("demoMacroProtein"), value: MACROS.protein },
    { label: t("demoMacroFat"), value: MACROS.fat },
    { label: t("demoMacroCarbs"), value: MACROS.carbs },
  ];

  return (
    <section className="border-b border-rule bg-paper">
      <div className="mx-auto max-w-[1320px] px-6 py-16 md:px-10 lg:px-14 lg:py-20">
        {/* Заголовок */}
        <div className="mb-9 max-w-[700px]">
          <Eyebrow color="text-ochre-dk">{t("demoEyebrow")}</Eyebrow>
          <h2 className="mt-3.5 font-display text-[40px] font-normal leading-[0.95] tracking-[-0.02em] text-burg sm:text-[56px]">
            {t("demoTitle1")} <em className="italic text-ochre">{t("demoTitleAccent")}</em>
          </h2>
          <p className="mt-5 font-reader text-[17px] leading-[1.7] text-ink">{t("demoLede")}</p>
        </div>

        {/* «Окно» приложения */}
        <div className="overflow-hidden border border-rule bg-crust">
          {/* Строка ссылки */}
          <div className="flex items-center gap-3 border-b border-rule bg-paper px-4 py-3.5 md:px-5">
            <span className="hidden font-body text-[10px] font-semibold uppercase tracking-[0.16em] text-soft sm:block">
              {t("demoUrlLabel")}
            </span>
            <div className="flex flex-1 items-center overflow-hidden whitespace-nowrap border border-rule bg-crust px-3 py-2 font-body text-[13px] text-ink">
              <span className="text-soft">https://</span>
              {typedUrl}
              <span
                className={cn(
                  "ml-0.5 inline-block w-px self-stretch bg-ink",
                  typing ? "animate-pulse" : "opacity-0",
                )}
                aria-hidden
              >
                &nbsp;
              </span>
            </div>
            <span
              className={cn(
                "shrink-0 px-2.5 py-1.5 font-body text-[10px] font-bold uppercase tracking-[0.16em] transition-colors",
                importing
                  ? "animate-pulse bg-ochre text-seal"
                  : "border border-rule text-soft",
              )}
            >
              {importing ? t("demoImporting") : "AI"}
            </span>
          </div>

          {/* Тело: поля + обложка */}
          <div className="grid md:grid-cols-2">
            {/* Поля */}
            <div className="border-b border-rule p-6 md:border-b-0 md:border-r md:p-7">
              <h3
                className={cn(
                  "font-display text-[24px] font-normal leading-[1.1] text-ink transition-all duration-500 sm:text-[28px]",
                  showFields ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
                )}
              >
                {t("demoRecipeTitle")}
              </h3>

              <p
                className={cn(
                  "mt-3 max-w-[46ch] font-reader text-[15px] leading-[1.6] text-soft transition-all delay-100 duration-500",
                  showFields ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
                )}
              >
                {t("demoDescription")}
              </p>

              <div
                className={cn(
                  "mt-5 transition-opacity duration-500",
                  showFields ? "opacity-100" : "opacity-0",
                )}
              >
                <Eyebrow color="text-ochre-dk">{t("demoIngredientsLabel")}</Eyebrow>
              </div>
              <ul className="mt-3 space-y-1.5">
                {ingredients.map((ing, i) => (
                  <li
                    key={ing}
                    className={cn(
                      "font-body text-[14px] leading-[1.6] text-ink transition-all duration-300",
                      i < revealedIng ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0",
                    )}
                  >
                    {ing}
                  </li>
                ))}
              </ul>
            </div>

            {/* Обложка */}
            <div className="relative aspect-square overflow-hidden bg-crust md:aspect-auto md:min-h-[300px]">
              <Image
                src="/demo-cover.jpg"
                alt={t("demoRecipeTitle")}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className={cn(
                  "object-cover transition-all duration-[900ms] ease-out",
                  imageReady ? "scale-100 opacity-100 blur-0" : "scale-105 opacity-0 blur-md",
                )}
              />
              {/* Заглушка до готовности картинки */}
              <div
                className={cn(
                  "absolute inset-0 flex items-center justify-center bg-crust transition-opacity duration-500",
                  imageReady ? "opacity-0" : "opacity-100",
                )}
              >
                <span className="font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-soft">
                  {generatingImage ? t("demoImageGenerating") : ""}
                </span>
              </div>
              <div
                className={cn(
                  "absolute left-3 top-3 z-10 bg-ochre px-2.5 py-1.5 font-body text-[10px] font-bold uppercase tracking-[0.16em] text-seal transition-opacity duration-500",
                  imageReady ? "opacity-100" : "opacity-0",
                )}
              >
                {t("demoImageLabel")}
              </div>
            </div>
          </div>

          {/* КБЖУ */}
          <div
            className={cn(
              "bg-section px-6 py-6 text-section-fg transition-opacity duration-500 md:px-7",
              showNutrition ? "opacity-100" : "opacity-30",
            )}
          >
            <Eyebrow color="text-ochre">{t("demoNutritionLabel")}</Eyebrow>
            <div className="mt-2 flex flex-wrap items-baseline gap-x-8 gap-y-4 border-t border-section-rule pt-4">
              <div className="flex items-baseline gap-3">
                <span className="font-display text-[56px] font-normal italic leading-none text-ochre sm:text-[64px]">
                  {kcalShown}
                </span>
                <span className="font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-section-fg/80">
                  {t("demoKcal")}
                </span>
              </div>
              <div className="flex gap-7 sm:gap-9">
                {macros.map((m) => (
                  <div key={m.label}>
                    <div className="font-body text-[10px] font-semibold uppercase tracking-[0.14em] text-section-soft">
                      {m.label}
                    </div>
                    <div className="mt-1">
                      <span className="font-display text-[28px] font-normal leading-none text-section-fg sm:text-[32px]">
                        {showNutrition ? m.value : 0}
                      </span>
                      <span className="ml-1 font-body text-[11px] font-semibold text-section-fg/65">
                        {t("demoGram")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Примечание + повтор + CTA */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-5 border-t border-rule pt-7">
          <p className="max-w-[500px] font-body text-[12px] leading-[1.7] text-soft">{t("demoNote")}</p>
          <div className="flex flex-wrap items-center gap-4">
            {!reduced && (
              <button
                type="button"
                onClick={replay}
                className="font-body text-[12px] font-semibold uppercase tracking-[0.15em] text-burg transition-colors hover:text-ochre-dk"
              >
                &#8635; {t("demoReplay")}
              </button>
            )}
            <EditorialButton href="/register">{t("demoCta")}</EditorialButton>
            <EditorialButton href="/recipes" variant="ghost">
              {t("demoCtaGhost")}
            </EditorialButton>
          </div>
        </div>
      </div>
    </section>
  );
}

import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { DropCap, Eyebrow } from "@/components/ui";
import RecipeOwnerActions from "@/components/dashboard/RecipeOwnerActions";
import NutritionFacts from "@/components/recipe/NutritionFacts";
import { localizedField, type Locale } from "@/lib/localized-content";
import type { NutritionData, Step } from "@/types";

export const dynamic = "force-dynamic";

/** 1-based position → roman numeral (magazine step mark). */
function toRoman(n: number): string {
  const map: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"],
    [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"],
    [5, "V"], [4, "IV"], [1, "I"],
  ];
  let out = "";
  let num = n;
  for (const [v, s] of map) {
    while (num >= v) {
      out += s;
      num -= v;
    }
  }
  return out || "—";
}

/** Parse ingredients string into sections and items (mirror of public page). */
function parseIngredients(raw: string) {
  const lines = raw.split("\n").filter((l) => l.trim());
  const sections: { header: string | null; items: string[] }[] = [];
  let current: { header: string | null; items: string[] } = { header: null, items: [] };

  for (const line of lines) {
    const trimmed = line.trim();
    const isHeader = /^—.+—$/.test(trimmed);
    if (isHeader) {
      if (current.items.length > 0 || current.header !== null) sections.push(current);
      current = { header: trimmed.replace(/^—\s*/, "").replace(/\s*—$/, ""), items: [] };
    } else {
      current.items.push(trimmed);
    }
  }
  if (current.items.length > 0 || current.header !== null) sections.push(current);
  return sections;
}

export default async function ViewUserRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [t, tr, locale, recipeRes] = await Promise.all([
    getTranslations("myRecipes"),
    getTranslations("recipe"),
    getLocale(),
    supabase
      .from("recipes")
      .select("*, steps(*)")
      .eq("id", id)
      .eq("owner_id", user.id)
      .maybeSingle(),
  ]);

  const recipe = recipeRes.data;
  if (!recipe) notFound();

  const l = locale as Locale;

  const title = localizedField(recipe, "title", l) ?? recipe.title;
  const story = localizedField(recipe, "note", l);
  const ingredientsRaw =
    localizedField(recipe, "ingredients", l) ?? recipe.ingredients ?? null;

  const ingredientSections = ingredientsRaw ? parseIngredients(ingredientsRaw) : [];
  const hasIngredients = ingredientSections.some((s) => s.items.length > 0);

  const steps = ((recipe.steps ?? []) as Step[]).slice().sort((a, b) => a.order - b.order);
  const hasSteps = steps.length > 0;

  const nutrition = (recipe.nutrition ?? null) as NutritionData | null;
  // Напитки не показывают КБЖУ — параллельно с публичной страницей.
  const isDrink = recipe.recipe_type === "drink";

  // Метрики в hero — реальные поля, никаких выдуманных «глав/сложностей».
  const metrics: { label: string; value: string; unit: string }[] = [];
  if (recipe.cook_time)
    metrics.push({ label: tr("cookTime"), value: String(recipe.cook_time), unit: tr("min") });
  if (recipe.servings)
    metrics.push({ label: tr("servings"), value: String(recipe.servings), unit: "" });
  if (!isDrink && nutrition?.per_serving?.kcal)
    metrics.push({
      label: tr("calories"),
      value: String(nutrition.per_serving.kcal),
      unit: tr("nutrition.kcal"),
    });
  if (hasSteps)
    metrics.push({ label: tr("stepsLabel"), value: String(steps.length), unit: "" });

  const servingsHeading = recipe.servings
    ? tr("servingsHeading", { count: recipe.servings })
    : tr("ingredients");
  const stepsHeading = tr("stepsHeading", { count: steps.length });

  return (
    <div className="bg-paper text-ink">
      {/* ── Breadcrumb strip + owner actions ────────────────────────────── */}
      <section className="mx-auto max-w-[1320px] px-6 pt-10 md:px-10 lg:px-14">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-5">
          <Link
            href="/dashboard/recipes"
            className="font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-soft transition-colors hover:text-burg"
          >
            {t("back")}
          </Link>
          <RecipeOwnerActions recipeId={recipe.id} />
        </div>
      </section>

      {/* ── Hero: заголовок + история + метрики (слева), фото (справа) ──── */}
      <section className="mx-auto max-w-[1320px] px-6 pb-10 pt-5 md:px-10 lg:px-14">
        <div
          className={
            recipe.cover_image
              ? "grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14"
              : ""
          }
        >
          {/* Левая колонка */}
          <div>
            <Eyebrow color="text-ochre-dk">{t("private")}</Eyebrow>
            <h1 className="mt-3 font-display text-[clamp(2.5rem,7vw,96px)] font-normal leading-[0.92] tracking-[-0.03em] text-burg">
              {title}
            </h1>

            {story && (
              <div className="mt-7 max-w-[560px]">
                <Eyebrow color="text-burg" className="mb-3">
                  {tr("dishStory")}
                </Eyebrow>
                <p className="font-display text-[20px] font-normal italic leading-[1.55] text-burg sm:text-[22px]">
                  {story.length > 120 ? (
                    <>
                      <DropCap>{story.charAt(0)}</DropCap>
                      {story.slice(1)}
                    </>
                  ) : (
                    story
                  )}
                </p>
              </div>
            )}

            {metrics.length > 0 && (
              <div className="mt-8 grid grid-cols-2 gap-4 border-t-2 border-burg pt-5 sm:max-w-[460px]">
                {metrics.map((m) => (
                  <div key={m.label}>
                    <Eyebrow color="text-soft" className="mb-1">
                      {m.label}
                    </Eyebrow>
                    <span className="font-display text-[36px] font-normal leading-none text-burg">
                      {m.value}
                    </span>
                    {m.unit && (
                      <span className="ml-1.5 font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-soft">
                        {m.unit}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Правая колонка: фото — квадрат (1:1), как на публичной странице */}
          {recipe.cover_image && (
            <div className="relative aspect-square w-full overflow-hidden lg:max-w-[520px] lg:justify-self-end">
              <Image
                src={recipe.cover_image}
                alt={title}
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 520px"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/65 to-transparent px-8 pb-6 pt-24">
                <Eyebrow color="text-paper/85">{tr("figCaption")}</Eyebrow>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Ingredients + Steps ─────────────────────────────────────────── */}
      {(hasIngredients || hasSteps) && (
        <section className="mx-auto max-w-[1320px] px-6 pb-20 pt-16 md:px-10 lg:px-14 lg:pt-20">
          <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-14">
            {hasIngredients && (
              <aside className="bg-crust px-7 py-8 lg:sticky lg:top-6 lg:self-start">
                <Eyebrow color="text-burg">{tr("ingredients")}</Eyebrow>
                <h2 className="mb-6 mt-2 font-display text-[32px] font-normal italic leading-none tracking-[-0.01em] text-burg sm:text-[36px]">
                  {servingsHeading}
                </h2>
                {ingredientSections.map((section, si) => (
                  <div key={si} className={si > 0 ? "mt-6" : ""}>
                    {section.header && (
                      <div className="mb-2 font-body text-[10px] font-bold uppercase tracking-[0.18em] text-ochre-dk">
                        {section.header}
                      </div>
                    )}
                    <ul>
                      {section.items.map((item, ii) => (
                        <li
                          key={ii}
                          className="border-t border-rule py-3 font-body text-[14px] leading-[1.4] text-ink first:border-t-0"
                        >
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </aside>
            )}

            {hasSteps && (
              <div className={hasIngredients ? "" : "lg:col-span-2"}>
                <Eyebrow color="text-ochre-dk">{tr("preparation")}</Eyebrow>
                <h2 className="mb-8 mt-2.5 font-display text-[36px] font-normal italic leading-none tracking-[-0.01em] text-burg sm:text-[42px]">
                  {stepsHeading}
                </h2>
                {steps.map((step, index) => {
                  const stepTitle = localizedField(step, "title", l) ?? step.title;
                  const stepDesc =
                    localizedField(step, "description", l) ?? step.description;
                  return (
                    <div
                      key={step.id}
                      className="grid grid-cols-[56px_1fr] items-start gap-5 border-t border-rule py-6 sm:grid-cols-[88px_1fr] sm:gap-6"
                    >
                      <div className="pt-1 font-display text-[44px] font-normal italic leading-[0.9] text-ochre sm:text-[60px]">
                        {toRoman(index + 1)}
                      </div>
                      <div>
                        {stepTitle && (
                          <h3 className="font-display text-[22px] font-normal tracking-[-0.01em] text-burg sm:text-[26px]">
                            {stepTitle}
                          </h3>
                        )}
                        <p className="mt-2 max-w-[580px] font-reader text-[15px] leading-[1.7] text-ink">
                          {stepDesc}
                        </p>
                        {step.photo_url && (
                          <div className="relative mt-4 aspect-[4/3] max-w-[580px] overflow-hidden">
                            <Image
                              src={step.photo_url}
                              alt={stepTitle ?? `${index + 1}`}
                              fill
                              className="object-cover"
                              sizes="(max-width: 768px) 100vw, 40vw"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ── КБЖУ (только цифры; диагностика — в админке). Напитки — без КБЖУ. ── */}
      {!isDrink && <NutritionFacts nutrition={nutrition} />}
    </div>
  );
}

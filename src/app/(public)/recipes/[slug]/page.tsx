import { cache, Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/admin";
import { localizedField, type Locale } from "@/lib/localized-content";
import type { Category, Step } from "@/types";
import RelatedRecipes, { RelatedRecipesSkeleton } from "@/components/recipe/RelatedRecipes";
import NutritionFacts from "@/components/recipe/NutritionFacts";
import FavoriteButton from "@/components/recipe/FavoriteButton";
import { DropCap, Eyebrow } from "@/components/ui";
import type { NutritionData } from "@/types";
import { getSiteUrl } from "@/lib/site-url";

/**
 * ISR: страница рендерится один раз, кэшируется на Vercel edge на час.
 * API-роуты (translate, calculate-nutrition, generate-image) дёргают
 * revalidatePath и инвалидируют кэш сразу.
 */
export const revalidate = 3600;

export async function generateStaticParams() {
  // Service-role client: на билде нет request scope (cookies/session).
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("recipes")
    .select("slug")
    .eq("published", true)
    .eq("visibility", "public"); // don't prerender private user recipes
  return (data ?? []).map((r) => ({ slug: r.slug }));
}

const SITE_URL = getSiteUrl();

/** Convert a 1-based position to a roman numeral (magazine step mark). */
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

/**
 * Renders a text string that may contain markdown-style links [label](url)
 * as clickable <Link> elements. Everything else is rendered as plain text.
 */
function renderTextWithLinks(text: string): React.ReactNode {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    parts.push(
      <Link
        key={match.index}
        href={match[2]}
        className="text-ochre-dk underline underline-offset-2 transition-colors hover:text-burg"
      >
        {match[1]}
      </Link>,
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length > 0 ? <>{parts}</> : text;
}

interface RecipePageProps {
  params: { slug: string };
}

// cache() ensures the DB query runs only once per request even though both
// generateMetadata and the page component call this function.
const getRecipe = cache(async function getRecipe(slug: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("recipes")
    .select(`
      *,
      steps ( * ),
      recipe_categories ( categories ( * ) )
    `)
    .eq("slug", slug)
    // Public route shows only public recipes — private user recipes never render
    // here, even for their owner or an admin (defense in depth on top of RLS).
    .eq("visibility", "public")
    .maybeSingle();

  if (!data) return null;

  return {
    ...data,
    categories: (data.recipe_categories ?? [])
      .map((rc: { categories: Category }) => rc.categories)
      .filter(Boolean) as Category[],
    steps: ((data.steps ?? []) as Step[]).sort((a, b) => a.order - b.order),
  };
});

/** Parse ingredients string into sections and items */
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

export async function generateMetadata({ params }: RecipePageProps): Promise<Metadata> {
  const slug = decodeURIComponent(params.slug);
  const recipe = await getRecipe(slug);

  if (!recipe) return { title: "Recipe not found — The Slow Table" };

  const locale = (await getLocale()) as Locale;
  const title = localizedField(recipe, "title", locale) ?? recipe.title;
  // Для мета/превью берём историю рецепта (note). Сенсорное «описание» —
  // только запасной вариант для старых рецептов, где истории ещё нет.
  const rawDesc =
    localizedField(recipe, "note", locale) ?? localizedField(recipe, "description", locale);

  const description = rawDesc
    ? rawDesc.length > 155
      ? rawDesc.slice(0, 152) + "…"
      : rawDesc
    : undefined;

  const pageUrl = `${SITE_URL}/recipes/${slug}`;
  const images = recipe.cover_image
    ? [{ url: recipe.cover_image, width: 1200, height: 900, alt: title }]
    : [];

  return {
    title: `${title} — The Slow Table`,
    description,
    alternates: { canonical: pageUrl },
    openGraph: {
      type: "article",
      url: pageUrl,
      title,
      description,
      images,
      siteName: "The Slow Table",
    },
    twitter: {
      card: images.length ? "summary_large_image" : "summary",
      title,
      description,
      images: images.map((img) => img.url),
    },
  };
}

/** Build ISO 8601 duration string from minutes (e.g. 90 → "PT1H30M") */
function toIsoDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `PT${h}H${m}M`;
  if (h > 0) return `PT${h}H`;
  return `PT${m}M`;
}

export default async function RecipePage({ params }: RecipePageProps) {
  const recipe = await getRecipe(decodeURIComponent(params.slug));
  if (!recipe) notFound();

  const [t, locale] = await Promise.all([getTranslations("recipe"), getLocale()]);
  const l = locale as Locale;

  const title = localizedField(recipe, "title", l) ?? recipe.title;
  // История блюда (поле note) — единственный текстовый блок про рецепт, стоит
  // сразу под заголовком. Старое сенсорное «описание» (description) на странице
  // больше не показываем, но держим как запасной текст для SEO/мета у рецептов,
  // у которых история ещё не написана.
  const story = localizedField(recipe, "note", l);
  const legacyDescription = localizedField(recipe, "description", l);
  const seoText = story ?? legacyDescription;

  const ingredientsRaw = localizedField(recipe, "ingredients", l) ?? recipe.ingredients ?? null;
  const ingredientSections = ingredientsRaw ? parseIngredients(ingredientsRaw) : [];
  const hasIngredients = ingredientSections.some((s) => s.items.length > 0);
  const hasSteps = recipe.steps.length > 0;

  const nutrition = recipe.nutrition as NutritionData | null;
  // Напитки не показывают КБЖУ — даже если у рецепта осталась старая nutrition
  // (например, его сконвертировали из «еды» в «напиток»).
  const isDrink = recipe.recipe_type === "drink";
  const primaryCategory = recipe.categories[0];
  const categoryLabel = primaryCategory
    ? localizedField(primaryCategory, "name", l) ?? primaryCategory.name
    : null;

  // Real metrics only — no fabricated "difficulty"/"chapter" fields.
  const metrics: { label: string; value: string; unit: string }[] = [];
  if (recipe.cook_time) metrics.push({ label: t("cookTime"), value: String(recipe.cook_time), unit: t("min") });
  if (recipe.servings) metrics.push({ label: t("servings"), value: String(recipe.servings), unit: "" });
  if (!isDrink && nutrition?.per_serving?.kcal)
    metrics.push({ label: t("calories"), value: String(nutrition.per_serving.kcal), unit: t("nutrition.kcal") });
  if (hasSteps) metrics.push({ label: t("stepsLabel"), value: String(recipe.steps.length), unit: "" });

  const servingsHeading = recipe.servings
    ? t("servingsHeading", { count: recipe.servings })
    : t("ingredients");
  const stepsHeading = t("stepsHeading", { count: recipe.steps.length });

  return (
    <div className="bg-paper text-ink">
      {/* ── Breadcrumb strip ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1320px] px-6 pt-10 md:px-10 lg:px-14">
        <div className="flex items-center justify-between gap-4 border-b border-rule pb-5 font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-soft">
          <Link href="/recipes" className="transition-colors hover:text-burg">
            {t("backToAll")}
          </Link>
          {categoryLabel && <span className="hidden sm:block">{categoryLabel}</span>}
          <span className="flex items-center gap-2 text-burg">
            <FavoriteButton
              slug={recipe.slug}
              className="h-7 w-7 rounded-none bg-transparent text-burg shadow-none hover:scale-100"
            />
          </span>
        </div>
      </section>

      {/* ── Hero: заголовок + метрики (слева) и фото (справа) ───────────── */}
      <section className="mx-auto max-w-[1320px] px-6 pb-10 pt-5 md:px-10 lg:px-14">
        <div
          className={
            recipe.cover_image
              ? "grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14"
              : ""
          }
        >
          {/* Левая колонка: рубрика + заголовок + описание + метрики */}
          <div>
            <Eyebrow color="text-ochre-dk">{categoryLabel ?? t("recipeFallback")}</Eyebrow>
            <h1 className="mt-3 font-display text-[clamp(2.5rem,7vw,96px)] font-normal leading-[0.92] tracking-[-0.03em] text-burg">
              {title}
            </h1>
            {story && (
              <div className="mt-7 max-w-[560px]">
                <Eyebrow color="text-burg" className="mb-3">
                  {t("dishStory")}
                </Eyebrow>
                <p className="font-display text-[20px] font-normal italic leading-[1.55] text-burg sm:text-[22px]">
                  {/* Буквица — только для историй подлиннее: на коротких она
                      «свисает» ниже текста и выглядит неаккуратно. */}
                  {story.length > 120 ? (
                    <>
                      <DropCap>{story.charAt(0)}</DropCap>
                      {renderTextWithLinks(story.slice(1))}
                    </>
                  ) : (
                    renderTextWithLinks(story)
                  )}
                </p>
                <div className="mt-3.5 font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-soft">
                  {t("authorSign")}
                </div>
              </div>
            )}

            {metrics.length > 0 && (
              <div className="mt-8 grid grid-cols-2 gap-4 border-t-2 border-burg pt-5 sm:max-w-[460px]">
                {metrics.map((m) => (
                  <div key={m.label}>
                    <Eyebrow color="text-soft" className="mb-1">
                      {m.label}
                    </Eyebrow>
                    <span className="font-display text-[36px] font-normal leading-none text-burg">{m.value}</span>
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

          {/* Правая колонка: фото — квадрат (1:1), единый формат для всех рецептов */}
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
                <Eyebrow color="text-paper/85">{t("figCaption")}</Eyebrow>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── Ingredients + Steps ─────────────────────────────────────────── */}
      {(hasIngredients || hasSteps) && (
        <section className="mx-auto max-w-[1320px] px-6 pb-20 pt-16 md:px-10 lg:px-14 lg:pt-20">
          <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-14">
            {/* Ingredients aside */}
            {hasIngredients && (
              <aside className="bg-crust px-7 py-8 lg:sticky lg:top-6 lg:self-start">
                <Eyebrow color="text-burg">{t("ingredients")}</Eyebrow>
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

            {/* Steps */}
            {hasSteps && (
              <div className={hasIngredients ? "" : "lg:col-span-2"}>
                <Eyebrow color="text-ochre-dk">{t("preparation")}</Eyebrow>
                <h2 className="mb-8 mt-2.5 font-display text-[36px] font-normal italic leading-none tracking-[-0.01em] text-burg sm:text-[42px]">
                  {stepsHeading}
                </h2>
                {recipe.steps.map((step: Step, index: number) => {
                  const stepTitle = localizedField(step, "title", l);
                  const stepDesc = localizedField(step, "description", l) ?? step.description;
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
                          {renderTextWithLinks(stepDesc)}
                        </p>
                        {step.photo_url && (
                          <div className="relative mt-4 aspect-[4/3] max-w-[580px] overflow-hidden">
                            <Image
                              src={step.photo_url}
                              alt={stepTitle ?? t("step", { number: index + 1 })}
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

      {/* История блюда теперь живёт сразу под заголовком (см. hero выше) —
          отдельный нижний блок убран, чтобы не дублировать текст. */}

      {/* ── Related (streamed — не блокирует first paint) ───────────────── */}
      <Suspense fallback={<RelatedRecipesSkeleton />}>
        <RelatedRecipes
          recipeId={recipe.id}
          categoryIds={recipe.categories.map((c: Category) => c.id)}
        />
      </Suspense>

      {/* ── Recipe JSON-LD Schema (for Google rich results) ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Recipe",
            name: title,
            description: seoText ?? undefined,
            image: recipe.cover_image ? [recipe.cover_image] : undefined,
            author: { "@type": "Person", name: "Daria", url: SITE_URL },
            datePublished: recipe.created_at,
            dateModified: recipe.updated_at,
            url: `${SITE_URL}/recipes/${recipe.slug}`,
            ...(recipe.cook_time ? { cookTime: toIsoDuration(recipe.cook_time) } : {}),
            ...(recipe.servings ? { recipeYield: String(recipe.servings) } : {}),
            recipeIngredient: ingredientSections.flatMap((s) => s.items),
            recipeInstructions: recipe.steps.map((step: Step, i: number) => ({
              "@type": "HowToStep",
              position: i + 1,
              name: localizedField(step, "title", l) ?? step.title ?? `Step ${i + 1}`,
              text: localizedField(step, "description", l) ?? step.description,
              ...(step.photo_url ? { image: step.photo_url } : {}),
            })),
          }),
        }}
      />
    </div>
  );
}

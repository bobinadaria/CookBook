import { cache, Suspense } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { localizedField, type Locale } from "@/lib/localized-content";
import type { Category, Step } from "@/types";
import RelatedRecipes, { RelatedRecipesSkeleton } from "@/components/recipe/RelatedRecipes";
import { getSiteUrl } from "@/lib/site-url";

/**
 * ISR: страница рендерится один раз, кэшируется на Vercel edge на час.
 * Если редактируешь рецепт через API роуты (translate, calculate-nutrition,
 * generate-image) — они вызывают revalidatePath и инвалидируют кэш сразу.
 * Если правишь рецепт через форму (updateRecipe→Supabase напрямую) — обновится
 * автоматически в течение часа (или жми «Hard Refresh» в браузере).
 */
export const revalidate = 3600;

/**
 * Build-time prerendering: на vercel build заранее рендерим все опубликованные
 * рецепты в статичный HTML. Первый посетитель получает готовую страницу
 * с edge'а — никакого SSR не дёргается.
 *
 * Новые рецепты (опубликованные после билда) рендерятся on-demand при первом
 * визите, потом кэшируются как обычное ISR.
 *
 * `dynamicParams: true` (по умолчанию) разрешает on-demand рендеринг slug-ов,
 * которых не было на билде.
 */
export async function generateStaticParams() {
  const supabase = createClient();
  const { data } = await supabase
    .from("recipes")
    .select("slug")
    .eq("published", true);
  return (data ?? []).map((r) => ({ slug: r.slug }));
}

const SITE_URL = getSiteUrl();

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
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <Link
        key={match.index}
        href={match[2]}
        className="text-peach hover:text-peach-dark underline underline-offset-2 transition-colors"
      >
        {match[1]}
      </Link>
    );
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

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
    // Detect section headers: lines that start AND end with —
    const isHeader = /^—.+—$/.test(trimmed);
    if (isHeader) {
      if (current.items.length > 0 || current.header !== null) {
        sections.push(current);
      }
      current = { header: trimmed.replace(/^—\s*/, "").replace(/\s*—$/, ""), items: [] };
    } else {
      current.items.push(trimmed);
    }
  }
  if (current.items.length > 0 || current.header !== null) {
    sections.push(current);
  }

  return sections;
}

export async function generateMetadata({ params }: RecipePageProps): Promise<Metadata> {
  const slug = decodeURIComponent(params.slug);
  const recipe = await getRecipe(slug);

  // If the recipe doesn't exist, Next.js will call notFound() in the page
  // component — return a minimal fallback here so the build doesn't break.
  if (!recipe) {
    return { title: "Recipe not found — CookBook" };
  }

  const locale = (await getLocale()) as Locale;
  const title = localizedField(recipe, "title", locale) ?? recipe.title;
  const rawDesc =
    localizedField(recipe, "description", locale) ??
    localizedField(recipe, "note", locale);

  // Trim description to ~155 chars for search result snippets.
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
    title: `${title} — CookBook`,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      type: "article",
      url: pageUrl,
      title,
      description,
      images,
      siteName: "CookBook",
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

  const [t, locale] = await Promise.all([
    getTranslations("recipe"),
    getLocale(),
  ]);
  const l = locale as Locale;

  const title = localizedField(recipe, "title", l) ?? recipe.title;
  const description = localizedField(recipe, "description", l);
  const note = localizedField(recipe, "note", l);

  const ingredientsRaw = localizedField(recipe, "ingredients", l) ?? recipe.ingredients ?? null;
  const ingredientSections = ingredientsRaw ? parseIngredients(ingredientsRaw) : [];
  const hasMultipleSections = ingredientSections.some((s) => s.header !== null);

  return (
    <main className="min-h-dvh">
      <div className="px-6 pt-10 max-w-5xl mx-auto">
        <Link href="/recipes" className="text-sm text-charcoal/50 hover:text-charcoal transition-colors">
          {t("backToAll")}
        </Link>
      </div>

      {/* ── Hero: title + cover ── */}
      <section className="px-6 pt-8 pb-12 max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-start">
        <div>
          {recipe.categories.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-4">
              {recipe.categories.map((cat: Category) => (
                <span key={cat.id} className="text-xs font-medium bg-sand text-charcoal px-3 py-1 rounded-full">
                  {localizedField(cat as unknown as Record<string, unknown>, "name", l) ?? cat.name}
                </span>
              ))}
            </div>
          )}
          <h1 className="font-serif text-[clamp(2rem,5vw,3.5rem)] leading-tight text-charcoal mb-6">
            {title}
          </h1>
          {description && (
            <p className="text-charcoal/70 text-lg leading-relaxed mb-6">{renderTextWithLinks(description)}</p>
          )}

          {/* ── Cook time + servings pills ── */}
          {(recipe.cook_time || recipe.servings) && (
            <div className="flex gap-3 flex-wrap">
              {recipe.cook_time && (
                <div className="flex items-center gap-2 bg-sand px-4 py-2.5 rounded-2xl">
                  <svg className="w-4 h-4 text-peach shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                    <circle cx="12" cy="12" r="9" />
                    <path strokeLinecap="round" d="M12 7v5l3 3" />
                  </svg>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-charcoal/40 leading-none mb-0.5">{t("cookTime")}</p>
                    <p className="text-sm font-medium text-charcoal leading-none">
                      {recipe.cook_time < 60
                        ? t("minutes", { n: recipe.cook_time })
                        : recipe.cook_time % 60 === 0
                          ? t("hoursOnly", { h: Math.floor(recipe.cook_time / 60) })
                          : t("hours", { h: Math.floor(recipe.cook_time / 60), m: recipe.cook_time % 60 })}
                    </p>
                  </div>
                </div>
              )}
              {recipe.servings && (
                <div className="flex items-center gap-2 bg-sand px-4 py-2.5 rounded-2xl">
                  <svg className="w-4 h-4 text-sage shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path strokeLinecap="round" d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-charcoal/40 leading-none mb-0.5">{t("servings")}</p>
                    <p className="text-sm font-medium text-charcoal leading-none">{recipe.servings}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {recipe.cover_image && (
          <div className="relative aspect-[4/3] rounded-card overflow-hidden shadow-card">
            <Image
              src={recipe.cover_image}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
        )}
      </section>

      {/* ── Story / Note ── */}
      {note && (
        <section className="px-6 pb-12 max-w-5xl mx-auto">
          <div className="bg-sand rounded-card p-8 md:p-10">
            <span className="font-handwritten text-sage text-lg block mb-3">{t("dishStory")}</span>
            <p className="font-handwritten text-2xl text-charcoal/80 leading-relaxed">
              &ldquo;{note}&rdquo;
            </p>
          </div>
        </section>
      )}

      {/* ── Ingredients ── */}
      {ingredientSections.length > 0 && (
        <section className="px-6 pb-14 max-w-5xl mx-auto">
          <h2 className="font-serif text-4xl text-charcoal mb-8">{t("ingredients")}</h2>

          {hasMultipleSections ? (
            /* Sectioned layout: cards per group */
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {ingredientSections.map((section, si) => (
                <div key={si} className="bg-sand/60 rounded-2xl p-5">
                  {section.header && (
                    <p className="text-[11px] uppercase tracking-widest text-charcoal/40 font-medium mb-3">
                      {section.header}
                    </p>
                  )}
                  <ul className="space-y-2">
                    {section.items.map((item, ii) => (
                      <li key={ii} className="flex items-start gap-2.5 text-sm text-charcoal/75">
                        <span className="w-1 h-1 rounded-full bg-peach mt-2 shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            /* Simple flat list — no sections */
            <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-2.5">
              {ingredientSections[0]?.items.map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-charcoal/70">
                  <span className="w-1.5 h-1.5 rounded-full bg-peach/60 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {/* ── Steps ── */}
      {recipe.steps.length > 0 && (
        <section className="px-6 pb-24 max-w-5xl mx-auto">
          <h2 className="font-serif text-4xl text-charcoal mb-8">{t("preparation")}</h2>

          <div className="grid md:grid-cols-2 gap-5">
            {recipe.steps.map((step: Step, index: number) => {
              const stepTitle = localizedField(step as unknown as Record<string, unknown>, "title", l);
              const stepDesc = localizedField(step as unknown as Record<string, unknown>, "description", l) ?? step.description;

              return (
                <div key={step.id} className="bg-sand/50 rounded-2xl p-6 flex flex-col gap-4">
                  {/* Step number + title */}
                  <div className="flex items-center gap-3">
                    <span className="font-handwritten text-3xl text-peach/50 leading-none shrink-0">
                      {index + 1}
                    </span>
                    {stepTitle && (
                      <h3 className="font-serif text-lg text-charcoal leading-snug">{stepTitle}</h3>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-charcoal/65 text-sm leading-relaxed">{renderTextWithLinks(stepDesc)}</p>

                  {/* Photo if available */}
                  {step.photo_url && (
                    <div className="relative aspect-[4/3] rounded-xl overflow-hidden mt-auto">
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
              );
            })}
          </div>
        </section>
      )}

      {/* ── Related recipes (streamed independently — не блокирует first paint) ── */}
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
            description: description ?? undefined,
            image: recipe.cover_image ? [recipe.cover_image] : undefined,
            author: {
              "@type": "Person",
              name: "Daria",
              url: SITE_URL,
            },
            datePublished: recipe.created_at,
            dateModified: recipe.updated_at,
            url: `${SITE_URL}/recipes/${recipe.slug}`,
            ...(recipe.cook_time
              ? { cookTime: toIsoDuration(recipe.cook_time) }
              : {}),
            ...(recipe.servings
              ? { recipeYield: String(recipe.servings) }
              : {}),
            recipeIngredient: ingredientSections.flatMap((s) => s.items),
            recipeInstructions: recipe.steps.map((step: Step, i: number) => ({
              "@type": "HowToStep",
              position: i + 1,
              name:
                localizedField(
                  step as unknown as Record<string, unknown>,
                  "title",
                  l
                ) ??
                step.title ??
                `Step ${i + 1}`,
              text:
                localizedField(
                  step as unknown as Record<string, unknown>,
                  "description",
                  l
                ) ?? step.description,
              ...(step.photo_url ? { image: step.photo_url } : {}),
            })),
          }),
        }}
      />
    </main>
  );
}

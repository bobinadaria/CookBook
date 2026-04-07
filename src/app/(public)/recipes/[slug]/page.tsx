import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, getLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { localizedField, type Locale } from "@/lib/localized-content";
import type { Category, Step } from "@/types";

interface RecipePageProps {
  params: { slug: string };
}

async function getRecipe(slug: string) {
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
}

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
    <main className="min-h-screen">
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
                  {cat.name}
                </span>
              ))}
            </div>
          )}
          <h1 className="font-serif text-[clamp(2rem,5vw,3.5rem)] leading-tight text-charcoal mb-6">
            {title}
          </h1>
          {description && (
            <p className="text-charcoal/70 text-lg leading-relaxed">{description}</p>
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
                  <p className="text-charcoal/65 text-sm leading-relaxed">{stepDesc}</p>

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
    </main>
  );
}

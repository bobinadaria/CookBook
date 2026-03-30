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

  return (
    <main className="min-h-screen">
      <div className="px-6 pt-10 max-w-5xl mx-auto">
        <Link href="/recipes" className="text-sm text-charcoal/50 hover:text-charcoal transition-colors">
          {t("backToAll")}
        </Link>
      </div>

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

      {recipe.steps.length > 0 && (
        <section className="px-6 pb-24 max-w-5xl mx-auto">
          <h2 className="font-serif text-4xl text-charcoal mb-10">{t("preparation")}</h2>
          <div className="space-y-12">
            {recipe.steps.map((step: Step, index: number) => {
              const stepTitle = localizedField(step as unknown as Record<string, unknown>, "title", l);
              const stepDesc = localizedField(step as unknown as Record<string, unknown>, "description", l) ?? step.description;

              return (
                <div key={step.id} className="grid md:grid-cols-12 gap-6 items-start">
                  <div className="md:col-span-1">
                    <span className="font-handwritten text-4xl text-peach/50">{index + 1}</span>
                  </div>
                  <div className="md:col-span-6">
                    {stepTitle && (
                      <h3 className="font-serif text-xl text-charcoal mb-3">{stepTitle}</h3>
                    )}
                    <p className="text-charcoal/70 leading-relaxed">{stepDesc}</p>
                  </div>
                  {step.photo_url && (
                    <div className="md:col-span-5">
                      <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-card">
                        <Image
                          src={step.photo_url}
                          alt={stepTitle ?? t("step", { number: index + 1 })}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, 40vw"
                        />
                      </div>
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

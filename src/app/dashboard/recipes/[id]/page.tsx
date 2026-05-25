import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { Eyebrow, DropCap } from "@/components/ui";
import RecipeOwnerActions from "@/components/dashboard/RecipeOwnerActions";
import NutritionFacts from "@/components/recipe/NutritionFacts";
import type { Step, NutritionData } from "@/types";

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

export default async function ViewUserRecipePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [t, tr, recipeRes] = await Promise.all([
    getTranslations("myRecipes"),
    getTranslations("recipe"),
    supabase
      .from("recipes")
      .select("*, steps(*)")
      .eq("id", params.id)
      .eq("owner_id", user.id)
      .maybeSingle(),
  ]);

  const recipe = recipeRes.data;
  if (!recipe) notFound();

  const nutrition = (recipe.nutrition ?? null) as NutritionData | null;

  const steps = ((recipe.steps ?? []) as Step[]).slice().sort((a, b) => a.order - b.order);
  const ingredientLines = (recipe.ingredients ?? "")
    .split("\n")
    .map((l: string) => l.trim())
    .filter(Boolean);

  const hasIngredients = ingredientLines.length > 0;
  const hasSteps = steps.length > 0;

  return (
    <main className="mx-auto min-h-dvh max-w-5xl px-6 pb-24">
      {/* Breadcrumb + owner actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-rule pb-5 pt-10">
        <Link
          href="/dashboard/recipes"
          className="font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-soft transition-colors hover:text-burg"
        >
          {t("back")}
        </Link>
        <RecipeOwnerActions recipeId={recipe.id} />
      </div>

      {/* Title */}
      <header className="pb-10 pt-6">
        <Eyebrow color="text-ochre-dk">{t("private")}</Eyebrow>
        <h1 className="mt-3 font-display text-[clamp(2.2rem,6vw,72px)] font-normal leading-[0.95] tracking-[-0.03em] text-burg">
          {recipe.title}
        </h1>
        {recipe.note && (
          <div className="mt-6 max-w-[640px]">
            <Eyebrow color="text-burg" className="mb-3">
              {tr("dishStory")}
            </Eyebrow>
            <p className="font-display text-[20px] font-normal italic leading-[1.55] text-burg sm:text-[22px]">
              {recipe.note.length > 120 ? (
                <>
                  <DropCap>{recipe.note.charAt(0)}</DropCap>
                  {recipe.note.slice(1)}
                </>
              ) : (
                recipe.note
              )}
            </p>
          </div>
        )}
        {(recipe.cook_time || recipe.servings) && (
          <div className="mt-6 flex gap-8 border-t-2 border-burg pt-4">
            {recipe.cook_time ? (
              <div>
                <Eyebrow color="text-soft" className="mb-1">
                  {tr("cookTime")}
                </Eyebrow>
                <span className="font-display text-[32px] leading-none text-burg">
                  {recipe.cook_time}
                </span>
                <span className="ml-1.5 font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-soft">
                  {tr("min")}
                </span>
              </div>
            ) : null}
            {recipe.servings ? (
              <div>
                <Eyebrow color="text-soft" className="mb-1">
                  {tr("servings")}
                </Eyebrow>
                <span className="font-display text-[32px] leading-none text-burg">
                  {recipe.servings}
                </span>
              </div>
            ) : null}
          </div>
        )}
      </header>

      {/* Cover (квадрат, как и фото в рецептах) */}
      {recipe.cover_image && (
        <div className="relative mx-auto mb-12 aspect-square w-full max-w-[560px] overflow-hidden">
          <Image
            src={recipe.cover_image}
            alt={recipe.title}
            fill
            priority
            sizes="(max-width:600px) 100vw, 560px"
            className="object-cover"
          />
        </div>
      )}

      {/* Ingredients + steps */}
      {(hasIngredients || hasSteps) && (
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-14">
          {hasIngredients && (
            <aside className="bg-crust px-7 py-8 lg:sticky lg:top-6 lg:self-start">
              <Eyebrow color="text-burg">{tr("ingredients")}</Eyebrow>
              <ul className="mt-4">
                {ingredientLines.map((item: string, i: number) => (
                  <li
                    key={i}
                    className="border-t border-rule py-3 font-body text-[14px] leading-[1.4] text-ink first:border-t-0"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </aside>
          )}

          {hasSteps && (
            <div className={hasIngredients ? "" : "lg:col-span-2"}>
              <Eyebrow color="text-ochre-dk">{tr("preparation")}</Eyebrow>
              <div className="mt-2.5">
                {steps.map((step, index) => (
                  <div
                    key={step.id}
                    className="grid grid-cols-[56px_1fr] items-start gap-5 border-t border-rule py-6 sm:grid-cols-[88px_1fr] sm:gap-6"
                  >
                    <div className="pt-1 font-display text-[44px] font-normal italic leading-[0.9] text-ochre sm:text-[60px]">
                      {toRoman(index + 1)}
                    </div>
                    <div>
                      {step.title && (
                        <h3 className="font-display text-[22px] font-normal tracking-[-0.01em] text-burg sm:text-[26px]">
                          {step.title}
                        </h3>
                      )}
                      <p className="mt-2 max-w-[580px] font-reader text-[15px] leading-[1.7] text-ink">
                        {step.description}
                      </p>
                      {step.photo_url && (
                        <div className="relative mt-4 aspect-[4/3] max-w-[580px] overflow-hidden">
                          <Image
                            src={step.photo_url}
                            alt={step.title ?? `${index + 1}`}
                            fill
                            className="object-cover"
                            sizes="(max-width:768px) 100vw, 40vw"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Пищевая ценность (AI): показываем рассчитанное КБЖУ, если оно есть. Сам расчёт — в форме рецепта. */}
      {recipe.nutrition && (
        <div className="mt-14">
          <NutritionFacts nutrition={nutrition} />
        </div>
      )}

      {/* История блюда теперь показывается под заголовком (см. header выше). */}
    </main>
  );
}

import { getLocale, getTranslations } from "next-intl/server";
import { fetchRelatedRecipes } from "@/lib/supabase/queries/recipes";
import RecipeCard from "./RecipeCard";
import type { LocaleCode } from "@/types";

interface RelatedRecipesProps {
  recipeId: string;
  categoryIds: string[];
}

export default async function RelatedRecipes({
  recipeId,
  categoryIds,
}: RelatedRecipesProps) {
  const [related, t, rawLocale] = await Promise.all([
    fetchRelatedRecipes(recipeId, categoryIds),
    getTranslations("recipe"),
    getLocale(),
  ]);

  if (related.length === 0) return null;

  const locale = rawLocale as LocaleCode;

  return (
    <section className="px-6 pb-24 max-w-5xl mx-auto">
      <div className="border-t border-sand pt-14">
        <span className="font-handwritten text-sage text-xl block mb-2">
          {t("youMightAlsoLike")}
        </span>
        <h2 className="font-serif text-3xl text-charcoal mb-8">
          {t("relatedRecipes")}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {related.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              locale={locale}
              aspectClass="aspect-[4/3]"
            />
          ))}
        </div>
      </div>
    </section>
  );
}

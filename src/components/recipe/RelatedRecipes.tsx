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

/**
 * Skeleton-плейсхолдер, который видит юзер пока подгружается список похожих.
 * Высота/отступы повторяют реальный блок, чтобы не было layout-shift.
 */
export function RelatedRecipesSkeleton() {
  return (
    <section className="px-6 pb-24 max-w-5xl mx-auto" aria-hidden>
      <div className="border-t border-sand pt-14">
        <div className="h-5 w-32 bg-sand/60 rounded mb-3 animate-pulse" />
        <div className="h-9 w-64 bg-sand/60 rounded mb-8 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-3">
              <div className="aspect-[4/3] bg-sand/60 rounded-2xl animate-pulse" />
              <div className="h-4 w-3/4 bg-sand/60 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

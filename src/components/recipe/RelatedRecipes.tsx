import { getLocale, getTranslations } from "next-intl/server";
import { fetchRelatedRecipes } from "@/lib/supabase/queries/recipes";
import RecipeCard from "./RecipeCard";
import { Eyebrow } from "@/components/ui";
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
    <section className="mx-auto max-w-[1320px] border-t border-rule px-6 pb-16 pt-10 md:px-10 lg:px-14">
      <div className="mb-7 flex items-end justify-between gap-6">
        <div>
          <Eyebrow color="text-ochre-dk">{t("youMightAlsoLike")}</Eyebrow>
          <h2 className="mt-2 font-display text-[36px] font-normal italic leading-[0.95] tracking-[-0.01em] text-burg sm:text-[48px]">
            {t("relatedRecipes")}
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-x-7 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((recipe, i) => (
          <RecipeCard key={recipe.id} recipe={recipe} locale={locale} index={i + 1} />
        ))}
      </div>
    </section>
  );
}

/**
 * Skeleton-плейсхолдер, пока подгружается список похожих. Высота/отступы
 * повторяют реальный блок, чтобы не было layout-shift.
 */
export function RelatedRecipesSkeleton() {
  return (
    <section
      className="mx-auto max-w-[1320px] border-t border-rule px-6 pb-16 pt-10 md:px-10 lg:px-14"
      aria-hidden
    >
      <div className="mb-7">
        <div className="mb-3 h-4 w-32 animate-pulse bg-crust" />
        <div className="h-10 w-64 animate-pulse bg-crust" />
      </div>
      <div className="grid grid-cols-1 gap-x-7 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="space-y-4">
            <div className="aspect-square animate-pulse bg-crust" />
            <div className="h-5 w-3/4 animate-pulse bg-crust" />
          </div>
        ))}
      </div>
    </section>
  );
}

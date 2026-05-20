"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import RecipeForm from "@/components/admin/RecipeForm";
import { fetchRecipeById } from "@/lib/supabase/recipes";
import type { RecipeInput } from "@/lib/supabase/recipes";
import type { NutritionData } from "@/types";

export default function EditRecipePage() {
  const { id } = useParams<{ id: string }>();
  const [defaults, setDefaults] = useState<(Partial<RecipeInput> & { cover_image?: string; nutrition?: NutritionData | null }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchRecipeById(id)
      .then((recipe) => {
        setDefaults({
          title: recipe.title,
          slug: recipe.slug,
          description: recipe.description ?? "",
          note: recipe.note ?? "",
          ingredients: recipe.ingredients ?? "",
          published: recipe.published,
          featured: recipe.featured ?? false,
          cook_time: recipe.cook_time ?? null,
          servings: recipe.servings ?? null,
          cover_image: recipe.cover_image ?? undefined,
          nutrition: (recipe.nutrition ?? null) as NutritionData | null,
          categoryIds: (recipe.recipe_categories ?? []).map(
            (rc: { category_id: string }) => rc.category_id
          ),
          steps: (recipe.steps ?? [])
            .sort((a: { order: number }, b: { order: number }) => a.order - b.order)
            .map((s: { id: string; order: number; title: string | null; description: string; photo_url: string | null }) => ({
              id: s.id,
              order: s.order,
              title: s.title ?? "",
              description: s.description,
              photo_url: s.photo_url,
            })),
        });
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <span className="font-display italic text-2xl text-muted">Загрузка...</span>
      </div>
    );
  }

  if (error || !defaults) {
    return (
      <p className="text-sm text-red-400">Не удалось загрузить рецепт</p>
    );
  }

  return (
    <div>
      <span className="font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-ochre-dk block mb-2">редактирование</span>
      <h1 className="font-display text-4xl tracking-[-0.02em] text-burg mb-10">{defaults.title}</h1>
      <RecipeForm recipeId={id} defaultValues={defaults} />
    </div>
  );
}

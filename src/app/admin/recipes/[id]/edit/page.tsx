"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import RecipeForm from "@/components/admin/RecipeForm";
import { fetchRecipeById } from "@/lib/supabase/recipes";
import type { RecipeInput } from "@/lib/supabase/recipes";

export default function EditRecipePage() {
  const { id } = useParams<{ id: string }>();
  const [defaults, setDefaults] = useState<(Partial<RecipeInput> & { cover_image?: string }) | null>(null);
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
          cover_image: recipe.cover_image ?? undefined,
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
        <span className="font-handwritten text-2xl text-charcoal/30">Загрузка...</span>
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
      <span className="font-handwritten text-peach text-xl block mb-2">редактирование</span>
      <h1 className="font-serif text-4xl text-charcoal mb-10">{defaults.title}</h1>
      <RecipeForm recipeId={id} defaultValues={defaults} />
    </div>
  );
}

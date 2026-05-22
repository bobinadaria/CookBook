import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { fetchAllCategories } from "@/lib/supabase/queries";
import UserRecipeForm from "@/components/dashboard/UserRecipeForm";
import type { Step } from "@/types";

export const dynamic = "force-dynamic";

export default async function EditUserRecipePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [t, categories, recipeRes] = await Promise.all([
    getTranslations("myRecipes"),
    fetchAllCategories(),
    supabase
      .from("recipes")
      .select("*, steps(*), recipe_categories(category_id)")
      // Scoped to the owner here AND by RLS — a user can't edit others' recipes.
      .eq("id", params.id)
      .eq("owner_id", user.id)
      .maybeSingle(),
  ]);

  const recipe = recipeRes.data;
  if (!recipe) notFound();

  const steps = ((recipe.steps ?? []) as Step[])
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((s) => ({
      id: s.id,
      order: s.order,
      title: s.title ?? "",
      description: s.description,
      photo_url: s.photo_url ?? null,
    }));

  const categoryIds = ((recipe.recipe_categories ?? []) as { category_id: string }[]).map(
    (rc) => rc.category_id,
  );

  const defaultValues = {
    title: recipe.title ?? "",
    description: recipe.description ?? "",
    note: recipe.note ?? "",
    ingredients: recipe.ingredients ?? "",
    cook_time: recipe.cook_time ?? null,
    servings: recipe.servings ?? null,
    cover_image: recipe.cover_image ?? null,
    categoryIds,
    steps,
  };

  return (
    <main className="mx-auto min-h-dvh max-w-2xl px-6 pb-24">
      <div className="pb-8 pt-10">
        <Link
          href={`/dashboard/recipes/${params.id}`}
          className="font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-soft transition-colors hover:text-burg"
        >
          {t("back")}
        </Link>
        <h1 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] font-normal leading-[0.95] tracking-[-0.02em] text-burg">
          {t("editTitle")}
        </h1>
      </div>
      <UserRecipeForm categories={categories} recipeId={params.id} defaultValues={defaultValues} />
    </main>
  );
}

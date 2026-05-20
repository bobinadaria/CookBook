"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import RecipeCard from "@/components/recipe/RecipeCard";
import { EditorialButton, Eyebrow } from "@/components/ui";
import { useFavorites } from "@/context/FavoritesContext";
import { createClient } from "@/lib/supabase/client";

interface FavoriteRecipe {
  id: string;
  title: string;
  title_en: string | null;
  slug: string;
  cover_image: string | null;
}

function FavoritesContent() {
  const t = useTranslations("favorites");
  const tc = useTranslations("common");
  const { user, favorites } = useFavorites();
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [recipes, setRecipes] = useState<FavoriteRecipe[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setChecked(true);
      if (!user) router.replace("/login");
    }, 400);
    return () => clearTimeout(t);
  }, [user, router]);

  // Fetch recipes matching favorited slugs
  useEffect(() => {
    if (!user || favorites.size === 0) {
      setRecipes([]);
      setLoading(false);
      return;
    }

    const slugs = Array.from(favorites);
    const supabase = createClient();
    supabase
      .from("recipes")
      .select("id, title, title_en, slug, cover_image")
      .eq("published", true)
      .in("slug", slugs)
      .then(({ data }) => {
        setRecipes(data ?? []);
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, favorites]);

  if (!checked || loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <span className="font-display text-2xl italic text-muted">{tc("loading")}</span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="mx-auto min-h-dvh max-w-5xl px-6">
      {/* Header */}
      <div className="flex items-end justify-between gap-6 pb-8 pt-10">
        <div>
          <Eyebrow color="text-ochre-dk">{t("tagline")}</Eyebrow>
          <h1 className="mt-3 font-display text-[clamp(2.5rem,5vw,3.5rem)] font-normal leading-[0.95] tracking-[-0.02em] text-burg">
            {t("title")}
          </h1>
        </div>
        {recipes.length > 0 && (
          <span className="hidden font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-soft sm:block">
            {t("recipeCount", { count: recipes.length })}
          </span>
        )}
      </div>

      {/* Content */}
      <section className="py-6">
        {recipes.length === 0 ? (
          <div className="border-t border-rule py-28 text-center">
            <p className="mb-4 font-display text-[28px] italic text-burg/40">{t("empty")}</p>
            <p className="mb-8 font-body text-sm text-soft">{t("emptyHint")}</p>
            <div className="flex justify-center">
              <EditorialButton variant="ghost" href="/recipes">
                {t("goToRecipes")}
              </EditorialButton>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} showMeta={false} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default function FavoritesPage() {
  // FavoritesProvider, Header и pt-16 теперь в dashboard/layout.tsx
  return <FavoritesContent />;
}

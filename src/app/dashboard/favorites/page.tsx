"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import RecipeCard from "@/components/recipe/RecipeCard";
import { FavoritesProvider, useFavorites } from "@/context/FavoritesContext";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/layout/Header";

interface FavoriteRecipe {
  id: string;
  title: string;
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
      .select("id, title, slug, cover_image")
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
      <div className="min-h-screen flex items-center justify-center">
        <span className="font-handwritten text-2xl text-charcoal/30">{tc("loading")}</span>
      </div>
    );
  }

  if (!user) return null;

  return (
    <main className="min-h-screen">
      {/* Header */}
      <div className="px-8 pt-10 pb-8 flex items-end justify-between">
        <div>
          <span className="font-handwritten text-peach text-xl block mb-2">
            {t("tagline")}
          </span>
          <h1 className="font-serif text-[clamp(2.5rem,5vw,4.5rem)] leading-none text-charcoal">
            {t("title")}
          </h1>
        </div>
        {recipes.length > 0 && (
          <span className="text-charcoal/30 text-sm hidden sm:block">
            {t("recipeCount", { count: recipes.length })}
          </span>
        )}
      </div>

      {/* Content */}
      <section className="px-4 py-6">
        {recipes.length === 0 ? (
          <div className="text-center py-32">
            <p className="font-handwritten text-3xl text-charcoal/25 mb-4">
              {t("empty")}
            </p>
            <p className="text-sm text-charcoal/40 mb-8">
              {t("emptyHint")}
            </p>
            <Link
              href="/recipes"
              className="inline-flex items-center gap-2 text-sm text-peach hover:underline"
            >
              {t("goToRecipes")}
            </Link>
          </div>
        ) : (
          <div className="columns-2 lg:columns-3 xl:columns-4 gap-x-3">
            {recipes.map((recipe) => (
              <div key={recipe.id} className="break-inside-avoid mb-3">
                <RecipeCard recipe={recipe} />
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default function FavoritesPage() {
  return (
    <FavoritesProvider>
      <div className="pt-16">
        <Header />
        <FavoritesContent />
      </div>
    </FavoritesProvider>
  );
}

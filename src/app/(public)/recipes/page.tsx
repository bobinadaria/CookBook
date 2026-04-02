"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import RecipeCard from "@/components/recipe/RecipeCard";
import FilterDropdown from "@/components/recipe/FilterDropdown";
import RevealCard from "@/components/animations/RevealCard";
import { createClient } from "@/lib/supabase/client";
import type { Recipe, Category } from "@/types";

type ActiveFilters = Record<string, Set<string>>;

interface FilterGroup {
  type: string;
  label: string;
  items: Category[];
}

const CATEGORY_LABEL_KEYS: Record<string, string> = {
  meal_type: "mealType",
  meal_time: "mealTime",
  ingredient: "ingredient",
  season: "season",
  country: "country",
};

const ASPECT_CYCLE = [
  "aspect-[3/4]",
  "aspect-[4/3]",
  "aspect-[1/1]",
  "aspect-[4/3]",
  "aspect-[2/3]",
  "aspect-[4/3]",
  "aspect-[1/1]",
  "aspect-[3/4]",
  "aspect-[4/3]",
  "aspect-[1/1]",
  "aspect-[4/3]",
  "aspect-[3/4]",
];

const PAGE_SIZE = 28;

export default function RecipesPage() {
  const t = useTranslations("recipes");
  const tf = useTranslations("filters");
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Load recipes + categories from Supabase
  useEffect(() => {
    const supabase = createClient();

    Promise.all([
      supabase
        .from("recipes")
        .select(`
          id, title, title_en, title_cs, slug, description, note, cover_image, published, created_at, updated_at,
          recipe_categories ( categories ( id, name, slug, type ) )
        `)
        .eq("published", true)
        .order("created_at", { ascending: false }),

      supabase
        .from("categories")
        .select("*")
        .order("type")
        .order("name"),
    ]).then(([{ data: recipesData }, { data: catsData }]) => {
      // Transform recipes: flatten nested recipe_categories → categories[]
      const transformed: Recipe[] = (recipesData ?? []).map((r: Record<string, unknown>) => ({
        ...(r as Omit<Recipe, "categories">),
        categories: ((r.recipe_categories as { categories: Category }[]) ?? [])
          .map((rc) => rc.categories)
          .filter(Boolean) as Category[],
      }));
      setRecipes(transformed);

      // Build filter groups from categories
      const grouped = (catsData ?? []).reduce<Record<string, Category[]>>((acc, cat) => {
        (acc[cat.type] ??= []).push(cat);
        return acc;
      }, {});
      setFilterGroups(
        Object.entries(grouped).map(([type, items]) => ({
          type,
          label: CATEGORY_LABEL_KEYS[type] ?? type,
          items,
        }))
      );
    }).finally(() => setLoading(false));
  }, []);

  const toggleFilter = useCallback((groupType: string, catId: string) => {
    setActiveFilters((prev) => {
      const next = { ...prev };
      const set = new Set(next[groupType] ?? []);
      if (set.has(catId)) set.delete(catId); else set.add(catId);
      if (set.size === 0) delete next[groupType];
      else next[groupType] = set;
      return next;
    });
  }, []);

  const clearAll = () => {
    setActiveFilters({});
    setSearch("");
  };

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [search, activeFilters]);

  const totalActive = Object.values(activeFilters).reduce((sum, s) => sum + s.size, 0);
  const hasActiveFilters = totalActive > 0 || search !== "";

  const filtered = useMemo(() => {
    return recipes.filter((recipe) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !recipe.title.toLowerCase().includes(q) &&
          !(recipe.description?.toLowerCase().includes(q) ?? false)
        ) return false;
      }
      for (const [groupType, ids] of Object.entries(activeFilters)) {
        if (ids.size === 0) continue;
        const recipeIds = new Set(
          (recipe.categories ?? []).filter((c) => c.type === groupType).map((c) => c.id)
        );
        if (!Array.from(ids).some((id) => recipeIds.has(id))) return false;
      }
      return true;
    });
  }, [recipes, search, activeFilters]);

  const countLabel = (n: number) => t("recipeCount", { count: n });

  return (
    <main className="min-h-screen">
      {/* ── Page header ── */}
      <div className="px-8 pt-10 pb-8 flex items-end justify-between">
        <div>
          <span className="font-handwritten text-peach text-xl block mb-2">{t("tagline")}</span>
          <h1 className="font-serif text-[clamp(2.5rem,5vw,4.5rem)] leading-none text-charcoal">
            {t("catalog")}
          </h1>
        </div>
        {!loading && (
          <span className="text-charcoal/30 text-sm hidden sm:block">
            {countLabel(filtered.length)}
          </span>
        )}
      </div>

      {/* ── Filter bar ── */}
      <div className="border-y border-sand bg-cream">
        <div className="px-8 py-3 flex items-center gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

          {/* Search */}
          <div className="relative flex-shrink-0">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search")}
              className="bg-sand rounded-full pl-9 pr-8 py-2.5 text-sm text-charcoal placeholder:text-charcoal/35 outline-none focus:ring-2 focus:ring-peach/30 transition w-44 focus:w-56 duration-300"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal/35 hover:text-charcoal transition-colors text-xs">✕</button>
            )}
          </div>

          {filterGroups.length > 0 && <div className="w-px h-5 bg-charcoal/10 flex-shrink-0 mx-1" />}

          {filterGroups.map((group) => (
            <FilterDropdown
              key={group.type}
              label={CATEGORY_LABEL_KEYS[group.type] ? tf(CATEGORY_LABEL_KEYS[group.type]) : group.label}
              groupType={group.type}
              items={group.items}
              activeIds={activeFilters[group.type] ?? new Set()}
              isOpen={openGroup === group.type}
              onToggle={() => setOpenGroup(openGroup === group.type ? null : group.type)}
              onSelect={toggleFilter}
              onClose={() => setOpenGroup(null)}
            />
          ))}

          {hasActiveFilters && (
            <>
              <div className="w-px h-5 bg-charcoal/10 flex-shrink-0 mx-1" />
              <button
                onClick={clearAll}
                className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-charcoal/40 hover:text-peach transition-colors whitespace-nowrap flex-shrink-0"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
                {t("reset")}{totalActive > 0 ? ` (${totalActive})` : ""}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Recipe grid ── */}
      <section className="px-4 py-10">
        {loading ? (
          /* Skeleton */
          <div className="columns-2 lg:columns-3 xl:columns-4 gap-x-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className={`break-inside-avoid mb-3 rounded-2xl bg-sand animate-pulse ${ASPECT_CYCLE[i % ASPECT_CYCLE.length]}`}
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-32">
            <p className="font-handwritten text-3xl text-charcoal/30">
              {hasActiveFilters ? t("nothingFound") : t("noRecipes")}
            </p>
            {hasActiveFilters && (
              <button onClick={clearAll} className="mt-6 text-sm text-peach hover:underline">
                {t("resetFilters")}
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="columns-2 lg:columns-3 xl:columns-4 gap-x-3">
              {filtered.slice(0, visibleCount).map((recipe, i) => (
                <RevealCard key={recipe.id} index={i} className="break-inside-avoid mb-3">
                  <RecipeCard
                    recipe={recipe}
                    aspectClass={ASPECT_CYCLE[i % ASPECT_CYCLE.length]}
                  />
                </RevealCard>
              ))}
            </div>

            {filtered.length > visibleCount && (
              <div className="flex justify-center mt-16">
                <button
                  onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}
                  className="font-handwritten text-xl text-charcoal/50 hover:text-peach transition-colors duration-200 tracking-wide"
                >
                  {t("loadMore")}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

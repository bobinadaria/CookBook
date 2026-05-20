"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import RecipeCard from "@/components/recipe/RecipeCard";
import FilterDropdown from "@/components/recipe/FilterDropdown";
import RevealCard from "@/components/animations/RevealCard";
import { EditorialButton, Eyebrow } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { DISPLAYED_CATEGORY_TYPES } from "@/lib/category-types";
import type { Recipe, Category } from "@/types";

type ActiveFilters = Record<string, Set<string>>;

/** Категория + сколько опубликованных рецептов под ней (для счётчика и скрытия пустых). */
type CategoryWithCount = Category & { count: number };

interface FilterGroup {
  type: string;
  label: string;
  items: CategoryWithCount[];
}

const CATEGORY_LABEL_KEYS: Record<string, string> = {
  meal_type: "mealType",
  ingredient: "ingredient",
  season: "season",
  country: "country",
};

const PAGE_SIZE = 24;

/** Собирает весь текстовый контент рецепта по всем языкам для поиска. */
function getSearchableText(recipe: Recipe): string {
  return [recipe.title, recipe.title_en, recipe.description, recipe.description_en]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

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
          id, title, title_en, slug, description, description_en, note, cover_image, cook_time, published, created_at, updated_at,
          recipe_categories ( categories ( id, name, name_en, slug, type ) )
        `)
        .eq("published", true)
        .order("created_at", { ascending: false }),

      supabase.from("categories").select("*").order("type").order("name"),
    ]).then(([{ data: recipesData }, { data: catsData }]) => {
      const transformed: Recipe[] = (recipesData ?? []).map((r: Record<string, unknown>) => ({
        ...(r as Omit<Recipe, "categories">),
        categories: ((r.recipe_categories as { categories: Category }[]) ?? [])
          .map((rc) => rc.categories)
          .filter(Boolean) as Category[],
      }));
      setRecipes(transformed);

      const catCount: Record<string, number> = {};
      for (const r of transformed) {
        for (const c of r.categories ?? []) {
          catCount[c.id] = (catCount[c.id] ?? 0) + 1;
        }
      }

      const grouped = (catsData ?? []).reduce<Record<string, Category[]>>((acc, cat) => {
        (acc[cat.type] ??= []).push(cat);
        return acc;
      }, {});

      setFilterGroups(
        DISPLAYED_CATEGORY_TYPES.map((type) => ({
          type,
          label: CATEGORY_LABEL_KEYS[type] ?? type,
          items: (grouped[type] ?? [])
            .map((c) => ({ ...c, count: catCount[c.id] ?? 0 }))
            .filter((c) => c.count > 0)
            .sort((a, b) => b.count - a.count),
        })).filter((g) => g.items.length > 0),
      );
    }).finally(() => setLoading(false));
  }, []);

  const toggleFilter = useCallback((groupType: string, catId: string) => {
    setActiveFilters((prev) => {
      const next = { ...prev };
      const set = new Set(next[groupType] ?? []);
      if (set.has(catId)) set.delete(catId);
      else set.add(catId);
      if (set.size === 0) delete next[groupType];
      else next[groupType] = set;
      return next;
    });
  }, []);

  const clearAll = () => {
    setActiveFilters({});
    setSearch("");
  };

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, activeFilters]);

  const totalActive = Object.values(activeFilters).reduce((sum, s) => sum + s.size, 0);
  const hasActiveFilters = totalActive > 0 || search !== "";

  const filtered = useMemo(() => {
    return recipes.filter((recipe) => {
      if (search) {
        const q = search.toLowerCase();
        if (!getSearchableText(recipe).includes(q)) return false;
      }
      for (const [groupType, ids] of Object.entries(activeFilters)) {
        if (ids.size === 0) continue;
        const recipeIds = new Set(
          (recipe.categories ?? []).filter((c) => c.type === groupType).map((c) => c.id),
        );
        if (!Array.from(ids).some((id) => recipeIds.has(id))) return false;
      }
      return true;
    });
  }, [recipes, search, activeFilters]);

  const countLabel = (n: number) => t("recipeCount", { count: n });

  return (
    <div className="bg-paper text-ink">
      {/* ── Page header ── */}
      <div className="mx-auto flex max-w-[1320px] items-end justify-between gap-6 px-6 pb-8 pt-10 md:px-10 lg:px-14">
        <div>
          <Eyebrow color="text-ochre-dk">{t("tagline")}</Eyebrow>
          <h1 className="mt-3 font-display text-[clamp(2.75rem,6vw,72px)] font-normal leading-[0.92] tracking-[-0.03em] text-burg">
            {t("catalog")}
          </h1>
        </div>
        {!loading && (
          <span className="hidden whitespace-nowrap font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-soft sm:block">
            {countLabel(filtered.length)}
          </span>
        )}
      </div>

      {/* ── Filter bar ── */}
      <div className="border-y border-rule bg-paper">
        <div className="mx-auto flex max-w-[1320px] items-center gap-2 overflow-x-auto px-6 py-3 scrollbar-hide md:px-10 lg:px-14">
          {/* Search */}
          <div className="relative flex-shrink-0">
            <svg
              className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-soft"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("search")}
              className="w-44 rounded-none border border-rule bg-transparent py-2.5 pl-9 pr-8 text-sm text-ink outline-none transition duration-300 placeholder:text-muted focus:w-56 focus:border-burg"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-soft transition-colors hover:text-burg"
              >
                ✕
              </button>
            )}
          </div>

          {filterGroups.length > 0 && <div className="mx-1 h-5 w-px flex-shrink-0 bg-rule" />}

          {filterGroups.map((group) => (
            <FilterDropdown
              key={group.type}
              label={tf(group.label)}
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
              <div className="mx-1 h-5 w-px flex-shrink-0 bg-rule" />
              <button
                onClick={clearAll}
                className="flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap px-3 py-2.5 font-body text-[12px] font-semibold uppercase tracking-[0.12em] text-soft transition-colors hover:text-ochre-dk"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
                {t("reset")}
                {totalActive > 0 ? ` (${totalActive})` : ""}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Recipe grid ── */}
      <section className="mx-auto max-w-[1320px] px-6 py-12 md:px-10 lg:px-14">
        {loading ? (
          <div className="grid grid-cols-1 gap-x-9 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-[4/3] animate-pulse bg-crust" />
                <div className="h-5 w-3/4 animate-pulse bg-crust" />
                <div className="h-px bg-rule" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="border-t border-rule py-28 text-center">
            <p className="font-display text-[28px] italic text-burg/40">
              {hasActiveFilters ? t("nothingFound") : t("noRecipes")}
            </p>
            {hasActiveFilters && (
              <div className="mt-6 flex justify-center">
                <EditorialButton variant="ghost" onClick={clearAll}>
                  {t("resetFilters")}
                </EditorialButton>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-x-9 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.slice(0, visibleCount).map((recipe, i) => (
                <RevealCard key={recipe.id} index={i}>
                  <RecipeCard recipe={recipe} index={i + 1} />
                </RevealCard>
              ))}
            </div>

            {filtered.length > visibleCount && (
              <div className="mt-16 flex justify-center">
                <EditorialButton variant="ghost" onClick={() => setVisibleCount((n) => n + PAGE_SIZE)}>
                  {t("loadMore")}
                </EditorialButton>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

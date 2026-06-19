"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslations, useLocale } from "next-intl";
import RecipeCard from "@/components/recipe/RecipeCard";
import FilterDropdown from "@/components/recipe/FilterDropdown";
import RevealCard from "@/components/animations/RevealCard";
import { EditorialButton, Eyebrow } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { DISPLAYED_CATEGORY_TYPES } from "@/lib/category-types";
import { cn } from "@/lib/utils";
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
  drink_type: "drinkType",
  ingredient: "ingredient",
  season: "season",
  country: "country",
};

const PAGE_SIZE = 24;

/** Собирает весь текстовый контент рецепта по всем языкам для поиска. */
function getSearchableText(recipe: Recipe): string {
  return [
    recipe.title,
    recipe.title_en,
    recipe.note, // история блюда — теперь основной текст рецепта
    recipe.note_en,
    recipe.description, // legacy-описание: оставляем в поиске для старых рецептов
    recipe.description_en,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/** Нормализация для поиска: ё→е + lowercase (заодно ловим «свекла/свёкла»). */
function normalizeSearch(s: string): string {
  return s.toLowerCase().replace(/ё/g, "е");
}

/**
 * Поиск с устойчивостью к склонениям: «котлеты» находят «котлета», «вафлю» —
 * «вафля». Каждое слово запроса (≥3 букв) сверяем по нему и по «основам» —
 * отбрасываем до 2 последних букв (русские окончания). Все слова должны совпасть.
 * Короткие слова (<3) — точное вхождение.
 */
function matchesSearch(text: string, query: string): boolean {
  const haystack = normalizeSearch(text);
  const tokens = normalizeSearch(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return true;
  return tokens.every((tok) => {
    if (tok.length < 3) return haystack.includes(tok);
    for (let cut = 0; cut <= 2; cut++) {
      const stem = tok.slice(0, tok.length - cut);
      if (stem.length >= 3 && haystack.includes(stem)) return true;
    }
    return false;
  });
}

export default function RecipesPage() {
  const t = useTranslations("recipes");
  const tf = useTranslations("filters");
  const locale = useLocale();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [filterGroups, setFilterGroups] = useState<FilterGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({});
  const [drinksOnly, setDrinksOnly] = useState(false);
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  // Портал монтируем только на клиенте (нужен document.body)
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Load recipes + categories from Supabase
  useEffect(() => {
    const supabase = createClient();

    Promise.all([
      supabase
        .from("recipes")
        .select(`
          id, title, title_en, slug, description, description_en, note, note_en, cover_image, cook_time, recipe_type, published, created_at, updated_at,
          recipe_categories ( categories ( id, name, name_en, slug, type ) )
        `)
        .eq("published", true)
        .eq("visibility", "public") // never surface private user recipes
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
    setDrinksOnly(false);
  };

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [search, activeFilters, drinksOnly]);

  // Блокируем скролл фона, пока открыт мобильный лист фильтров
  useEffect(() => {
    if (!mobileFiltersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [mobileFiltersOpen]);

  const totalActive = Object.values(activeFilters).reduce((sum, s) => sum + s.size, 0);
  const hasActiveFilters = totalActive > 0 || search !== "" || drinksOnly;
  // Счётчик для бейджа на кнопке «Фильтры»: категории + флаг «только напитки»
  const mobileActiveCount = totalActive + (drinksOnly ? 1 : 0);
  const catName = (c: CategoryWithCount) => (locale === "en" && c.name_en ? c.name_en : c.name);

  const filtered = useMemo(() => {
    return recipes.filter((recipe) => {
      if (drinksOnly && recipe.recipe_type !== "drink") return false;
      if (search && !matchesSearch(getSearchableText(recipe), search)) return false;
      for (const [groupType, ids] of Object.entries(activeFilters)) {
        if (ids.size === 0) continue;
        const recipeIds = new Set(
          (recipe.categories ?? []).filter((c) => c.type === groupType).map((c) => c.id),
        );
        if (!Array.from(ids).some((id) => recipeIds.has(id))) return false;
      }
      return true;
    });
  }, [recipes, search, activeFilters, drinksOnly]);

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
        {/* Mobile (<md): поиск во всю ширину + кнопка «Фильтры», открывающая лист */}
        <div className="flex items-center gap-2 px-6 py-3 md:hidden">
          <div className="relative flex-1">
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
              className="w-full rounded-none border border-rule bg-transparent py-2.5 pl-9 pr-8 text-sm text-ink outline-none placeholder:text-muted focus:border-burg"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label={t("reset")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-soft transition-colors hover:text-burg"
              >
                ✕
              </button>
            )}
          </div>
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className={cn(
              "flex min-h-[44px] flex-shrink-0 items-center gap-2 rounded-none border px-4 font-body text-[12px] font-semibold uppercase tracking-[0.12em] transition-colors",
              mobileActiveCount > 0
                ? "border-ochre/50 bg-ochre/15 text-ochre-dk"
                : "border-rule bg-transparent text-soft",
            )}
          >
            {t("filtersButton")}
            {mobileActiveCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-none bg-burg text-[10px] font-semibold leading-none text-paper">
                {mobileActiveCount}
              </span>
            )}
          </button>
        </div>

        {/* Desktop (md+): горизонтальный ряд фильтров */}
        <div className="mx-auto hidden max-w-[1320px] items-center gap-2 overflow-x-auto px-6 py-3 scrollbar-hide md:flex md:px-10 lg:px-14">
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

          <div className="mx-1 h-5 w-px flex-shrink-0 bg-rule" />

          {/* Тип рецепта (не категория): показать только напитки */}
          <button
            onClick={() => setDrinksOnly((v) => !v)}
            className={cn(
              "flex min-h-[44px] flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-none border px-4 py-2.5 font-body text-[12px] font-semibold uppercase tracking-[0.12em] transition-all duration-200",
              drinksOnly
                ? "border-burg bg-burg text-paper"
                : "border-rule bg-transparent text-soft hover:border-burg hover:text-burg",
            )}
          >
            {t("drinksFilter")}
          </button>

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

      {/* ── Mobile filter sheet (<md) ──
          Рендерим через портал в document.body: родительский PageTransition
          задаёт transform/will-change, из-за чего position:fixed внутри него
          считается от обёртки, а не от вьюпорта (лист уезжал под экран). */}
      {mounted && mobileFiltersOpen && createPortal(
        <div className="fixed inset-0 z-[9999] md:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col border-t border-burg bg-paper pb-safe">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-rule px-6 py-4">
              <span className="font-display text-[24px] italic leading-none text-burg">
                {t("filtersButton")}
              </span>
              <button
                onClick={() => setMobileFiltersOpen(false)}
                aria-label={t("reset")}
                className="-mr-1 flex h-10 w-10 items-center justify-center text-lg text-soft transition-colors hover:text-burg"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-2">
              {/* Тип рецепта: только напитки */}
              <button
                onClick={() => setDrinksOnly((v) => !v)}
                className="flex w-full items-center gap-3 py-3 text-left text-sm transition-colors"
              >
                <span
                  className={cn(
                    "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-none border transition-colors",
                    drinksOnly ? "border-burg bg-burg" : "border-rule",
                  )}
                >
                  {drinksOnly && (
                    <svg className="h-3 w-3 text-paper" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                <span className={cn("flex-1", drinksOnly ? "font-semibold text-burg" : "text-ink")}>
                  {t("drinksFilter")}
                </span>
              </button>

              {/* Группы категорий */}
              {filterGroups.map((group) => (
                <div key={group.type} className="mt-2 border-t border-rule pt-3">
                  <div className="mb-1 font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-soft">
                    {tf(group.label)}
                  </div>
                  {group.items.map((cat) => {
                    const checked = (activeFilters[group.type] ?? new Set()).has(cat.id);
                    return (
                      <button
                        key={cat.id}
                        onClick={() => toggleFilter(group.type, cat.id)}
                        className="flex w-full items-center gap-3 py-3 text-left text-sm transition-colors"
                      >
                        <span
                          className={cn(
                            "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-none border transition-colors",
                            checked ? "border-burg bg-burg" : "border-rule",
                          )}
                        >
                          {checked && (
                            <svg className="h-3 w-3 text-paper" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </span>
                        <span className={cn("flex-1", checked ? "font-semibold text-burg" : "text-ink")}>
                          {catName(cat)}
                        </span>
                        <span className="text-xs tabular-nums text-muted">{cat.count}</span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-3 border-t border-rule px-6 py-4">
              {hasActiveFilters && (
                <button
                  onClick={clearAll}
                  className="flex-shrink-0 font-body text-[12px] font-semibold uppercase tracking-[0.12em] text-soft transition-colors hover:text-ochre-dk"
                >
                  {t("reset")}
                  {mobileActiveCount > 0 ? ` (${mobileActiveCount})` : ""}
                </button>
              )}
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="flex min-h-[48px] flex-1 items-center justify-center rounded-none bg-burg px-4 font-body text-[12px] font-semibold uppercase tracking-[0.14em] text-paper transition-colors hover:bg-burg-dk"
              >
                {t("showResults", { count: filtered.length })}
              </button>
            </div>
          </div>
        </div>,
        document.body,
      )}

      {/* ── Recipe grid ── */}
      <section className="mx-auto max-w-[1320px] px-6 py-12 md:px-10 lg:px-14">
        {loading ? (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-9 sm:gap-y-12 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-4">
                <div className="aspect-square animate-pulse bg-crust" />
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
            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-9 sm:gap-y-12 lg:grid-cols-3">
              {filtered.slice(0, visibleCount).map((recipe, i) => (
                <RevealCard key={recipe.id} index={i}>
                  <RecipeCard recipe={recipe} index={i + 1} compact />
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

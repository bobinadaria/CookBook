"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Category, CategoryType } from "@/types";

interface UseCategoriesResult {
  categories: Category[];
  grouped: Record<string, Category[]>;
  loading: boolean;
  error: string | null;
}

/**
 * Fetches all categories once and memoizes them for the component lifetime.
 * Optionally filters by one or more types.
 *
 * @example
 * const { categories, grouped } = useCategories();
 * const { categories } = useCategories({ types: ["country", "meal_type"] });
 */
export function useCategories(options?: { types?: CategoryType[] }): UseCategoriesResult {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Стабильный ключ из списка типов: «country,meal_type». Меняется только когда
  // реально меняется набор фильтров — не на каждый рендер (options — новый объект
  // каждый раз). Без этого пустой [] не перезапрашивал при смене фильтра.
  const typesKey = options?.types?.length ? [...options.types].sort().join(",") : "";

  useEffect(() => {
    setLoading(true);
    const supabase = createClient();
    let query = supabase.from("categories").select("*").order("type").order("name");

    const types = typesKey ? typesKey.split(",") : [];
    if (types.length) {
      query = query.in("type", types);
    }

    query.then(({ data, error }) => {
      if (error) setError(error.message);
      else setCategories((data ?? []) as Category[]);
      setLoading(false);
    });
  }, [typesKey]);

  const grouped = useMemo(
    () =>
      categories.reduce<Record<string, Category[]>>((acc, cat) => {
        (acc[cat.type] ??= []).push(cat);
        return acc;
      }, {}),
    [categories]
  );

  return { categories, grouped, loading, error };
}

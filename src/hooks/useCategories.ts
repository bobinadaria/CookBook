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

  useEffect(() => {
    const supabase = createClient();
    let query = supabase.from("categories").select("*").order("type").order("name");

    if (options?.types?.length) {
      query = query.in("type", options.types);
    }

    query.then(({ data, error }) => {
      if (error) setError(error.message);
      else setCategories((data ?? []) as Category[]);
      setLoading(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

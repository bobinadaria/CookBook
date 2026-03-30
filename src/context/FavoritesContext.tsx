"use client";

/**
 * Centralized favorites state — fetched once, shared across all recipe cards.
 *
 * Supabase table required (run once in Supabase SQL editor):
 *
 *   create table if not exists favorites (
 *     id          uuid primary key default gen_random_uuid(),
 *     user_id     uuid references auth.users(id) on delete cascade not null,
 *     recipe_slug text not null,
 *     created_at  timestamptz default now(),
 *     unique(user_id, recipe_slug)
 *   );
 *   alter table favorites enable row level security;
 *   create policy "select own" on favorites for select using (auth.uid() = user_id);
 *   create policy "insert own" on favorites for insert with check (auth.uid() = user_id);
 *   create policy "delete own" on favorites for delete using (auth.uid() = user_id);
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface FavoritesCtx {
  user: User | null;
  favorites: Set<string>;
  toggle: (slug: string) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesCtx>({
  user: null,
  favorites: new Set(),
  toggle: async () => {},
});

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Track auth state
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load favorites whenever user changes
  useEffect(() => {
    if (!user) { setFavorites(new Set()); return; }

    const supabase = createClient();
    supabase
      .from("favorites")
      .select("recipe_slug")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setFavorites(new Set(data.map((r: { recipe_slug: string }) => r.recipe_slug)));
      });
  }, [user?.id]);

  const toggle = useCallback(async (slug: string) => {
    if (!user) return;
    const supabase = createClient();

    if (favorites.has(slug)) {
      // Optimistic remove
      setFavorites((prev) => { const n = new Set(prev); n.delete(slug); return n; });
      await supabase.from("favorites").delete().match({ user_id: user.id, recipe_slug: slug });
    } else {
      // Optimistic add
      setFavorites((prev) => { const n = new Set(prev); n.add(slug); return n; });
      await supabase.from("favorites").insert({ user_id: user.id, recipe_slug: slug });
    }
  }, [user, favorites]);

  return (
    <FavoritesContext.Provider value={{ user, favorites, toggle }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  return useContext(FavoritesContext);
}

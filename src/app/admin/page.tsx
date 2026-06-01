"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { fetchAdminRecipes } from "@/lib/supabase/recipes";

export default function AdminPage() {
  const [total, setTotal] = useState<number | null>(null);
  const [published, setPublished] = useState<number | null>(null);

  useEffect(() => {
    fetchAdminRecipes()
      .then((recipes) => {
        setTotal(recipes.length);
        setPublished(recipes.filter((r) => r.published).length);
      })
      .catch(() => {});
  }, []);

  const stat = (val: number | null) =>
    val === null ? "—" : val;

  return (
    <div>
      <span className="font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-ochre-dk block mb-2">панель управления</span>
      <h1 className="font-display text-4xl tracking-[-0.02em] text-burg mb-10">Обзор</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-12">
        <div className="bg-crust rounded-none px-6 py-5">
          <p className="text-xs text-soft uppercase tracking-wider mb-1">Рецептов</p>
          <p className="font-display text-4xl tracking-[-0.02em] text-burg">{stat(total)}</p>
        </div>
        <div className="bg-crust rounded-none px-6 py-5">
          <p className="text-xs text-soft uppercase tracking-wider mb-1">Опубликовано</p>
          <p className="font-display text-4xl tracking-[-0.02em] text-ochre-dk">{stat(published)}</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-col gap-3">
        <Link
          href="/admin/recipes/new"
          className="inline-flex items-center gap-3 self-start bg-burg text-paper px-6 py-3.5 rounded-none text-sm font-medium hover:bg-burg-dk transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Новый рецепт
        </Link>
        <Link
          href="/admin/recipes"
          className="text-sm text-soft hover:text-ochre-dk transition-colors"
        >
          Все рецепты →
        </Link>
        <Link
          href="/admin/ingredient-requests"
          className="text-sm text-soft hover:text-ochre-dk transition-colors"
        >
          Запросы ингредиентов →
        </Link>
      </div>
    </div>
  );
}

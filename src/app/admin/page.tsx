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
      <span className="font-handwritten text-peach text-xl block mb-2">панель управления</span>
      <h1 className="font-serif text-4xl text-charcoal mb-10">Обзор</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-12">
        <div className="bg-sand rounded-2xl px-6 py-5">
          <p className="text-xs text-charcoal/40 uppercase tracking-wider mb-1">Рецептов</p>
          <p className="font-serif text-4xl text-charcoal">{stat(total)}</p>
        </div>
        <div className="bg-sand rounded-2xl px-6 py-5">
          <p className="text-xs text-charcoal/40 uppercase tracking-wider mb-1">Опубликовано</p>
          <p className="font-serif text-4xl text-peach">{stat(published)}</p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="flex flex-col gap-3">
        <Link
          href="/admin/recipes/new"
          className="inline-flex items-center gap-3 self-start bg-charcoal text-cream px-6 py-3.5 rounded-full text-sm font-medium hover:bg-peach transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Новый рецепт
        </Link>
        <Link
          href="/admin/recipes"
          className="text-sm text-charcoal/50 hover:text-peach transition-colors"
        >
          Все рецепты →
        </Link>
      </div>
    </div>
  );
}

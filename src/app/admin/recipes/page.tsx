"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchAdminRecipes, deleteRecipe, setRecipeFeatured, setRecipePublished } from "@/lib/supabase/recipes";
import { cn } from "@/lib/utils";
import QuickCreateModal from "@/components/admin/QuickCreateModal";
import ConfirmModal from "@/components/admin/ConfirmModal";

type AdminRecipe = {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  featured: boolean;
  created_at: string;
  cover_image: string | null;
};

const FEATURED_LIMIT = 6; // столько рецептов показывает блок «Шесть рецептов» на главной

export default function AdminRecipesPage() {
  const [recipes, setRecipes] = useState<AdminRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminRecipe | null>(null);
  const [savingFeatured, setSavingFeatured] = useState<string | null>(null);
  const [savingPublished, setSavingPublished] = useState<string | null>(null);

  const featuredCount = recipes.filter((r) => r.featured).length;

  const toggleFeatured = async (recipe: AdminRecipe) => {
    const next = !recipe.featured;
    setSavingFeatured(recipe.id);
    // оптимистично переключаем, при ошибке откатываем
    setRecipes((prev) => prev.map((r) => (r.id === recipe.id ? { ...r, featured: next } : r)));
    try {
      await setRecipeFeatured(recipe.id, next);
    } catch {
      setRecipes((prev) => prev.map((r) => (r.id === recipe.id ? { ...r, featured: !next } : r)));
    } finally {
      setSavingFeatured(null);
    }
  };

  const togglePublished = async (recipe: AdminRecipe) => {
    const next = !recipe.published;
    setSavingPublished(recipe.id);
    setRecipes((prev) => prev.map((r) => (r.id === recipe.id ? { ...r, published: next } : r)));
    try {
      await setRecipePublished(recipe.id, next);
    } catch {
      setRecipes((prev) => prev.map((r) => (r.id === recipe.id ? { ...r, published: !next } : r)));
    } finally {
      setSavingPublished(null);
    }
  };

  useEffect(() => {
    fetchAdminRecipes()
      .then(setRecipes)
      .finally(() => setLoading(false));
  }, []);

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    setDeleteTarget(null);
    setDeleting(id);
    try {
      await deleteRecipe(id);
      setRecipes((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // could show an inline error here in the future
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <span className="font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-ochre-dk block mb-2">управление</span>
          <h1 className="font-display text-4xl tracking-[-0.02em] text-burg">Рецепты</h1>
          {!loading && (
            <p className="mt-2 font-body text-xs text-soft">
              Рецепты месяца:{" "}
              <span
                className={cn(
                  "font-semibold",
                  featuredCount === FEATURED_LIMIT ? "text-olive" : "text-ochre-dk",
                )}
              >
                {featuredCount}
              </span>{" "}
              / {FEATURED_LIMIT}
              {featuredCount > FEATURED_LIMIT && " · показываются 6 самых свежих"}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex shrink-0 items-center gap-2 bg-burg text-paper px-5 py-2.5 rounded-none text-sm font-medium hover:bg-burg-dk transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Новый
        </button>
      </div>

      {!loading && (
        <div className="mb-8">
          <p className="font-display text-3xl tracking-[-0.02em] text-burg">
            Рецептов: {recipes.length}
          </p>
          <p className="mt-1 font-body text-sm text-soft">
            Опубликовано: {recipes.filter((r) => r.published).length}
          </p>
        </div>
      )}

      {loading ? (
        <p className="text-soft text-sm">Загрузка...</p>
      ) : recipes.length === 0 ? (
        <div className="text-center py-24">
          <p className="font-display italic text-2xl text-muted mb-3">Пока пусто</p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="text-sm text-ochre-dk hover:underline"
          >
            Добавить первый рецепт →
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="flex items-center gap-4 bg-crust/50 hover:bg-crust rounded-none px-4 py-3 transition-colors"
            >
              {/* Клик по карточке открывает редактирование */}
              <Link
                href={`/admin/recipes/${recipe.id}/edit`}
                className="flex flex-1 items-center gap-4 min-w-0"
              >
                {/* Thumbnail */}
                <div className="w-12 h-12 rounded-none overflow-hidden bg-crust shrink-0">
                  {recipe.cover_image ? (
                    <Image
                      src={recipe.cover_image}
                      alt={recipe.title}
                      width={48}
                      height={48}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-muted text-xs font-display italic">CB</span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink line-clamp-2">{recipe.title}</p>
                  <p className="text-xs text-muted truncate">/recipes/{recipe.slug}</p>
                </div>
              </Link>

              {/* Featured toggle — всегда видим; золотая звезда = в подборке на главной */}
              <button
                onClick={() => toggleFeatured(recipe)}
                disabled={savingFeatured === recipe.id}
                title={recipe.featured ? "Убрать из подборки на главной" : "Добавить в подборку на главной"}
                aria-pressed={recipe.featured}
                className={cn(
                  "p-2 rounded-none shrink-0 transition-colors disabled:opacity-40",
                  recipe.featured ? "text-ochre-dk hover:text-ochre" : "text-muted hover:text-burg",
                )}
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill={recipe.featured ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth={1.6}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.48 3.5a.56.56 0 011.04 0l2.12 5.11c.08.2.27.34.48.35l5.52.44c.5.04.7.66.32.99l-4.2 3.6a.56.56 0 00-.18.56l1.28 5.39a.56.56 0 01-.84.6l-4.72-2.88a.56.56 0 00-.59 0l-4.72 2.88a.56.56 0 01-.84-.6l1.28-5.39a.56.56 0 00-.18-.56l-4.2-3.6a.56.56 0 01.32-.99l5.52-.44a.56.56 0 00.48-.35L11.48 3.5z"
                  />
                </svg>
              </button>

              {/* Публикация — иконка-глаз; клик переключает прямо из списка */}
              <button
                onClick={() => togglePublished(recipe)}
                disabled={savingPublished === recipe.id}
                title={recipe.published ? "Опубликован — снять с публикации" : "Черновик — опубликовать"}
                aria-pressed={recipe.published}
                className={cn(
                  "p-2 rounded-none shrink-0 transition-colors disabled:opacity-40",
                  recipe.published ? "text-olive hover:text-olive/70" : "text-muted hover:text-burg",
                )}
              >
                {recipe.published ? (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.964 7.178.07.207.07.43 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.7}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243L9.88 9.88" />
                  </svg>
                )}
              </button>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setDeleteTarget(recipe)}
                  disabled={deleting === recipe.id}
                  className="p-2 rounded-none text-soft hover:text-red-400 hover:bg-red-50 transition-colors disabled:opacity-40"
                  title="Удалить"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreateModal && (
        <QuickCreateModal onClose={() => setShowCreateModal(false)} />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Удалить рецепт?"
          message={`«${deleteTarget.title}» будет удалён безвозвратно.`}
          confirmLabel="Удалить"
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}

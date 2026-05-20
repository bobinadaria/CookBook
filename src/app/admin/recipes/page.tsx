"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { fetchAdminRecipes, deleteRecipe } from "@/lib/supabase/recipes";
import { cn } from "@/lib/utils";
import QuickCreateModal from "@/components/admin/QuickCreateModal";
import ConfirmModal from "@/components/admin/ConfirmModal";

type AdminRecipe = {
  id: string;
  title: string;
  slug: string;
  published: boolean;
  created_at: string;
  cover_image: string | null;
};

export default function AdminRecipesPage() {
  const [recipes, setRecipes] = useState<AdminRecipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdminRecipe | null>(null);

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
      <div className="flex items-end justify-between mb-8">
        <div>
          <span className="font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-ochre-dk block mb-2">управление</span>
          <h1 className="font-display text-4xl tracking-[-0.02em] text-burg">Рецепты</h1>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-burg text-paper px-5 py-2.5 rounded-none text-sm font-medium hover:bg-burg-dk transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Новый
        </button>
      </div>

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
              className="flex items-center gap-4 bg-crust/50 hover:bg-crust rounded-none px-4 py-3 transition-colors group"
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
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{recipe.title}</p>
                <p className="text-xs text-muted truncate">/recipes/{recipe.slug}</p>
              </div>

              {/* Published badge */}
              <span
                className={cn(
                  "text-[11px] font-medium px-2.5 py-1 rounded-none shrink-0",
                  recipe.published
                    ? "bg-olive/15 text-olive"
                    : "bg-crust text-soft border border-rule"
                )}
              >
                {recipe.published ? "Опубликован" : "Черновик"}
              </span>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Link
                  href={`/recipes/${recipe.slug}`}
                  target="_blank"
                  className="p-2 rounded-none text-soft hover:text-burg hover:bg-paper transition-colors"
                  title="Просмотр"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </Link>
                <Link
                  href={`/admin/recipes/${recipe.id}/edit`}
                  className="p-2 rounded-none text-soft hover:text-burg hover:bg-paper transition-colors"
                  title="Редактировать"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </Link>
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

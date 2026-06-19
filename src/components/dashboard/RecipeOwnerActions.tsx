"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { EditorialButton } from "@/components/ui";
import { deleteUserRecipe } from "@/app/dashboard/recipes/actions";

/** Edit + Delete controls shown to the owner on their private recipe view. */
export default function RecipeOwnerActions({ recipeId }: { recipeId: string }) {
  const t = useTranslations("myRecipes");
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Esc закрывает подтверждение (если не идёт удаление).
  useEffect(() => {
    if (!confirmOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) setConfirmOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [confirmOpen, deleting]);

  const doDelete = async () => {
    setDeleting(true);
    setError(null);
    const res = await deleteUserRecipe(recipeId);
    if (res.ok) {
      router.push("/dashboard/recipes");
      router.refresh();
    } else {
      setDeleting(false);
      setError(t("deleteError"));
    }
  };

  return (
    <div className="flex items-center gap-3">
      <EditorialButton
        href={`/dashboard/recipes/${recipeId}/edit`}
        variant="ghost"
        className="px-6 py-2.5 text-[11px]"
      >
        {t("edit")}
      </EditorialButton>
      <EditorialButton
        type="button"
        variant="ghost"
        onClick={() => {
          setError(null);
          setConfirmOpen(true);
        }}
        className="px-6 py-2.5 text-[11px]"
      >
        {t("delete")}
      </EditorialButton>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget && !deleting) setConfirmOpen(false);
          }}
        >
          <div className="w-full max-w-sm rounded-none border border-rule bg-paper p-6 shadow-none">
            <h3 className="mb-1.5 font-display text-[22px] leading-snug text-burg">
              {t("deleteTitle")}
            </h3>
            <p className="mb-4 text-sm leading-relaxed text-soft">{t("deleteConfirm")}</p>

            {error && <p className="mb-4 bg-burg/5 px-3 py-2 text-xs text-burg">{error}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={doDelete}
                disabled={deleting}
                className="flex-1 rounded-none border border-burg bg-burg px-4 py-2.5 text-sm text-paper transition-colors hover:bg-burg-dk disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting ? t("deleting") : t("delete")}
              </button>
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={deleting}
                className="flex-1 rounded-none border border-rule bg-paper px-4 py-2.5 text-sm text-soft transition-colors hover:border-burg hover:text-burg disabled:opacity-40"
              >
                {t("cancel")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

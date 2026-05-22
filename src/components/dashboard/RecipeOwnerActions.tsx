"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { EditorialButton } from "@/components/ui";
import { deleteUserRecipe } from "@/app/dashboard/recipes/actions";

/** Edit + Delete controls shown to the owner on their private recipe view. */
export default function RecipeOwnerActions({ recipeId }: { recipeId: string }) {
  const t = useTranslations("myRecipes");
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(t("deleteConfirm"))) return;
    setDeleting(true);
    const res = await deleteUserRecipe(recipeId);
    if (res.ok) {
      router.push("/dashboard/recipes");
      router.refresh();
    } else {
      setDeleting(false);
      window.alert(t("errGeneric"));
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
        onClick={handleDelete}
        disabled={deleting}
        className="px-6 py-2.5 text-[11px]"
      >
        {deleting ? t("deleting") : t("delete")}
      </EditorialButton>
    </div>
  );
}

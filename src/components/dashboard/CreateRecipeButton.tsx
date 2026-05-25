"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { EditorialButton } from "@/components/ui";
import UserQuickCreateModal from "./UserQuickCreateModal";

/**
 * Кнопка «Добавить рецепт» в кабинете: вместо прямого перехода открывает
 * модалку (название + тип еда/напиток), и уже оттуда ведёт на форму создания.
 * Клиентская обёртка, чтобы держать состояние модалки на серверной странице.
 */
export default function CreateRecipeButton({
  disabled = false,
  className,
}: {
  disabled?: boolean;
  className?: string;
}) {
  const t = useTranslations("myRecipes");
  const [open, setOpen] = useState(false);

  return (
    <>
      <EditorialButton
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        className={className}
      >
        {t("addRecipe")}
      </EditorialButton>
      {open && <UserQuickCreateModal onClose={() => setOpen(false)} />}
    </>
  );
}

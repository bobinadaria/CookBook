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
  aiEnabled = false,
  label,
}: {
  disabled?: boolean;
  className?: string;
  /** Доступ к AI-фичам (premium/lifetime) — решает, заперт ли режим «Ссылка» в модалке. */
  aiEnabled?: boolean;
  /** Кастомный текст кнопки. По умолчанию — t("addRecipe"). */
  label?: React.ReactNode;
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
        {label ?? t("addRecipe")}
      </EditorialButton>
      {open && <UserQuickCreateModal onClose={() => setOpen(false)} aiEnabled={aiEnabled} />}
    </>
  );
}

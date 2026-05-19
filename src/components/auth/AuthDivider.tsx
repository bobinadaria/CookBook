"use client";

import { useTranslations } from "next-intl";

/**
 * Разделитель между OAuth-кнопкой и email-формой.
 * Тонкая линия с центрированным текстом «или войти по email».
 */
export default function AuthDivider() {
  const t = useTranslations("auth.shared");
  return (
    <div className="flex items-center gap-4 my-6">
      <div className="flex-1 h-px bg-charcoal/10" />
      <span className="text-xs text-charcoal/35 uppercase tracking-wider">
        {t("dividerText")}
      </span>
      <div className="flex-1 h-px bg-charcoal/10" />
    </div>
  );
}

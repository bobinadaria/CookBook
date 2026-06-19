"use client";

/**
 * Активная кнопка покупки (тариф или пакет картинок). Открывает CheckoutModal.
 * Состояния: idle / hover / press (active) / loading / disabled — оформлены
 * Tailwind-классами + локальный loading на время открытия окна.
 */
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui";
import { useCheckout } from "./CheckoutProvider";
import type { CheckoutItem } from "@/lib/checkout";

export default function CheckoutButton({
  item,
  label,
  variant = "outline",
  dark = false,
}: {
  item: CheckoutItem;
  label: string;
  /** primary — акцентная (охра); outline — обводка. */
  variant?: "primary" | "outline";
  /** Кнопка на тёмной секции (меняет цвета обводки). */
  dark?: boolean;
}) {
  const { open } = useCheckout();
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    setLoading(true);
    open(item);
    // короткая загрузка, пока поднимается окно оплаты
    setTimeout(() => setLoading(false), 400);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-none border-[1.5px] px-5 py-4 text-center font-body text-[12px] font-semibold uppercase tracking-[0.15em] transition-all",
        "active:translate-y-px disabled:cursor-wait disabled:opacity-70",
        variant === "primary"
          ? "border-ochre bg-ochre text-seal hover:bg-ochre-dk"
          : dark
            ? "border-ochre/60 text-ochre hover:bg-ochre/10"
            : "border-burg/50 text-burg hover:bg-burg hover:text-paper",
      )}
    >
      {loading && <Spinner size="sm" className="text-current" />}
      {label}
    </button>
  );
}

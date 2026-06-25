"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui";
import { downgradeToFree } from "@/app/dashboard/actions";

/**
 * Кнопка «Перейти на Free» для Premium-пользователя.
 * При клике открывает модальное окно с объяснением последствий и подтверждением.
 * Не показывать Lifetime-пользователям — разовый платёж, отменять нечего.
 */
export default function DowngradeToFreeButton({
  variant = "outline",
  dark = false,
  subtle = false,
  className,
}: {
  variant?: "primary" | "outline";
  dark?: boolean;
  /** Режим тихой ссылки — маленький текст без рамки */
  subtle?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const t = useTranslations("pricing");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    const result = await downgradeToFree();
    if (!result.ok) {
      setError(t("downgradeError"));
      setLoading(false);
      return;
    }
    router.refresh();
  };

  // Блокируем скролл фона пока модалка открыта
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const handleClose = () => {
    if (loading) return;
    setOpen(false);
    setError(null);
  };

  const triggerButton = subtle ? (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        "font-body text-[11px] text-muted underline underline-offset-2 transition-colors hover:text-burg",
        className,
      )}
    >
      {t("ctaSwitchFree")}
    </button>
  ) : (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        "flex w-full items-center justify-center gap-2 rounded-none border-[1.5px] px-5 py-4 text-center font-body text-[12px] font-semibold uppercase tracking-[0.15em] transition-all",
        "active:translate-y-px",
        variant === "primary"
          ? "border-ochre bg-ochre text-seal hover:bg-ochre-dk"
          : dark
            ? "border-ochre/60 text-ochre hover:bg-ochre/10"
            : "border-burg/50 text-burg hover:bg-burg hover:text-paper",
        className,
      )}
    >
      {t("ctaSwitchFree")}
    </button>
  );

  return (
    <>
      {triggerButton}

      {open &&
        createPortal(
          /* Оверлей */
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4"
            onClick={handleClose}
          >
            {/* Модальное окно */}
            <div
              className="w-full max-w-md border border-rule bg-paper p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Заголовок */}
              <p className="mb-1 font-body text-[10px] font-semibold uppercase tracking-[0.14em] text-ochre-dk">
                {t("downgradeModalEyebrow")}
              </p>
              <p className="font-display text-2xl leading-tight text-burg">
                {t("downgradeModalTitle")}
              </p>

              {/* Объяснение */}
              <p className="mt-4 font-body text-[13px] leading-[1.65] text-soft">
                {t("downgradeConfirmText")}
              </p>

              {error && (
                <p className="mt-3 font-body text-[12px] text-red-500">{error}</p>
              )}

              {/* Кнопки */}
              <div className="mt-6 flex gap-3">
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={loading}
                  className="flex flex-1 items-center justify-center gap-2 rounded-none border-[1.5px] border-burg bg-burg py-3 font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-paper transition-colors hover:bg-burg-dk disabled:cursor-wait disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" className="text-current" />
                      {t("downgradeLoading")}
                    </>
                  ) : (
                    t("downgradeConfirmYes")
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="rounded-none border-[1.5px] border-burg/50 px-5 py-3 font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-burg transition-colors hover:bg-burg hover:text-paper disabled:opacity-40"
                >
                  {t("downgradeCancel")}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}

"use client";

import { useEffect } from "react";

interface ConfirmDialogProps {
  title: string;
  message: string;
  /** Текст ОСНОВНОЙ (заметной) кнопки — безопасное действие: остаться/отменить уход. */
  cancelLabel: string;
  /** Текст ВТОРОСТЕПЕННОЙ кнопки — потенциально разрушительное действие (уйти/удалить). */
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Модальный диалог подтверждения в editorial-стиле бренда (только токены палитры,
 * без чужих цветов вроде красного).
 *
 * UX: основная (заполненная бордовая) кнопка — это БЕЗОПАСНОЕ действие
 * (`cancelLabel` — «Остаться»), а разрушительное (`confirmLabel` — «Уйти без
 * сохранения») оформлено как второстепенная ghost-кнопка, чтобы по нему не
 * кликали рефлекторно. Escape и клик по фону = безопасный выход (onCancel).
 */
export default function ConfirmDialog({
  title,
  message,
  cancelLabel,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div className="absolute inset-0 bg-burg/30 backdrop-blur-sm" />

      <div className="relative flex w-full max-w-md flex-col gap-5 rounded-3xl bg-paper p-7 shadow-2xl">
        <div className="flex flex-col gap-1.5">
          <h3 className="font-display text-2xl text-ink">{title}</h3>
          <p className="text-sm leading-relaxed text-soft">{message}</p>
        </div>

        <div className="flex gap-3 pt-1">
          {/* Основная, безопасная — остаться */}
          <button
            onClick={onCancel}
            className="flex-1 rounded-none bg-burg px-4 py-3 text-center text-sm font-medium text-paper transition-colors hover:bg-burg-dk"
          >
            {cancelLabel}
          </button>

          {/* Второстепенная, разрушительная — уйти без сохранения */}
          <button
            onClick={onConfirm}
            className="flex-1 rounded-none border border-rule px-4 py-3 text-center text-sm text-soft transition-colors hover:border-burg hover:text-burg"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

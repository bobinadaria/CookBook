"use client";

/**
 * Окно оформления покупки.
 *
 * Когда PAYMENTS_ENABLED=true — сразу создаёт Stripe Checkout Session и
 * редиректит пользователя на страницу оплаты Stripe (Hosted Checkout).
 * Модалка показывает спиннер «Переходим к оплате...» пока идёт редирект.
 *
 * Когда PAYMENTS_ENABLED=false — показывает заглушку «оплата скоро».
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Spinner } from "@/components/ui";
import { PAYMENTS_ENABLED, mountCheckout, type CheckoutItem } from "@/lib/checkout";

export default function CheckoutModal({
  item,
  onClose,
}: {
  item: CheckoutItem;
  onClose: () => void;
}) {
  const t = useTranslations("pricing.checkout");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  // Портал в body: иначе fixed-модалка позиционируется относительно
  // трансформированного PageTransition, а не вьюпорта (центр уезжает под фолд).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Блокируем скролл фона
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // Закрытие по Esc.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Если оплата включена — сразу создаём сессию и редиректим на Stripe.
  // Если нет — после короткой паузы показываем заглушку «скоро».
  useEffect(() => {
    let cancelled = false;

    if (PAYMENTS_ENABLED) {
      // Запускаем редирект; mountCheckout делает window.location.href — пользователь уйдёт
      mountCheckout(null!, item).catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });
    } else {
      const timer = setTimeout(() => {
        if (!cancelled) setLoading(false);
      }, 600);
      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }

    return () => { cancelled = true; };
  }, [item]);

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-none border border-rule bg-paper"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-rule px-5 py-3">
          <span className="font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-soft">
            {t("title")}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("close")}
            className="text-lg leading-none text-soft transition-colors hover:text-burg"
          >
            ✕
          </button>
        </div>

        <div className="px-5 py-6">
          {/* Что покупаем */}
          <p className="font-display text-[22px] leading-snug text-burg">{item.title}</p>
          <p className="mt-1 font-body text-[12px] font-semibold uppercase tracking-[0.14em] text-soft">
            {item.price}
          </p>

          {/* Область статуса оплаты */}
          <div className="mt-5 flex min-h-[120px] items-center justify-center border border-dashed border-rule p-5 text-center">
            {PAYMENTS_ENABLED ? (
              <>
                {loading && !error && (
                  <span className="flex items-center gap-2 text-sm text-soft">
                    <Spinner size="sm" /> {t("connecting")}
                  </span>
                )}
                {error && (
                  <span className="text-sm text-burg">{t("error")}</span>
                )}
              </>
            ) : loading ? (
              <span className="flex items-center gap-2 text-sm text-soft">
                <Spinner size="sm" /> {t("connecting")}
              </span>
            ) : (
              <span className="text-sm leading-relaxed text-soft">{t("unavailable")}</span>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-5 w-full rounded-none border border-rule px-5 py-3 font-body text-[12px] font-semibold uppercase tracking-[0.15em] text-soft transition-colors hover:border-burg hover:text-burg active:translate-y-px"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

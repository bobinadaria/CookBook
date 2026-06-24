"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui";
import { downgradeToFree } from "@/app/dashboard/actions";

/**
 * Кнопка «Перейти на Free» для Premium-пользователя — раньше вела в общий
 * CheckoutModal (заглушка «оплата скоро»), что не имело смысла: переход на
 * Free ничего не стоит, это не покупка. Теперь — отдельный server action
 * (downgradeToFree) с подтверждением и честным текстом про последствия.
 *
 * Не показывать Lifetime-пользователям: это разовый платёж, не подписка —
 * «отменять» нечего (см. комментарий в src/app/dashboard/actions.ts).
 */
export default function DowngradeToFreeButton({
  variant = "outline",
  dark = false,
  subtle = false,
  className,
}: {
  variant?: "primary" | "outline";
  dark?: boolean;
  /** Режим тихой ссылки — маленький текст без рамки, для PlanBanner */
  subtle?: boolean;
  className?: string;
}) {
  const router = useRouter();
  const t = useTranslations("pricing");
  const [confirming, setConfirming] = useState(false);
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
    // confirming/loading сбрасывать не нужно — страница перерисуется с новым
    // currentPlan, и этот компонент больше не должен показывать ту же кнопку.
  };

  if (confirming) {
    return (
      <div className={cn("border border-rule p-4", dark ? "border-section-rule" : "")}>
        <p
          className={cn(
            "font-body text-[12px] leading-[1.6]",
            dark ? "text-section-fg/85" : "text-soft",
          )}
        >
          {t("downgradeConfirmText")}
        </p>
        {error && <p className="mt-2 font-body text-[12px] text-red-500">{error}</p>}
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex flex-1 items-center justify-center gap-2 rounded-none border-[1.5px] border-burg bg-burg py-2.5 font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-paper transition-colors hover:bg-burg-dk disabled:cursor-wait disabled:opacity-60"
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
            onClick={() => {
              setConfirming(false);
              setError(null);
            }}
            disabled={loading}
            className={cn(
              "rounded-none border-[1.5px] px-4 py-2.5 font-body text-[11px] font-semibold uppercase tracking-[0.14em] transition-colors disabled:opacity-40",
              dark
                ? "border-ochre/60 text-ochre hover:bg-ochre/10"
                : "border-burg/50 text-burg hover:bg-burg hover:text-paper",
            )}
          >
            {t("downgradeCancel")}
          </button>
        </div>
      </div>
    );
  }

  if (subtle) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className={cn(
          "font-body text-[11px] text-muted underline underline-offset-2 transition-colors hover:text-burg",
          className,
        )}
      >
        {t("ctaSwitchFree")}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirming(true)}
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
}

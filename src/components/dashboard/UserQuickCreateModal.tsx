"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui";

/**
 * Быстрое создание рецепта в кабинете: пользователь вводит название и выбирает
 * тип (еда/напиток), затем попадает на форму создания с этими полями
 * (`/dashboard/recipes/new?title=…&type=…`). Сам рецепт появляется в БД только
 * после «Сохранить» — модалка ничего не пишет.
 */
export default function UserQuickCreateModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const t = useTranslations("myRecipes");
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"food" | "drink">("food");
  const [navigating, setNavigating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !navigating) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [navigating, onClose]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setError(t("errTitle"));
      return;
    }
    setNavigating(true);
    router.push(`/dashboard/recipes/new?title=${encodeURIComponent(trimmed)}&type=${type}`);
    // модалка остаётся со спиннером, пока идёт переход
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !navigating) onClose();
      }}
    >
      <div className="absolute inset-0 bg-burg/30 backdrop-blur-sm" />

      <div className="relative flex w-full max-w-md flex-col gap-6 rounded-3xl bg-paper p-8 text-left shadow-2xl">
        <div>
          <span className="mb-1 block font-display text-lg italic text-ochre-dk">
            {t("newTitle")}
          </span>
          <h2 className="font-display text-3xl leading-tight text-ink">{t("modalQuestion")}</h2>
          <p className="mt-1.5 text-sm text-soft">{t("modalHint")}</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setError(null);
            }}
            placeholder={t("fieldTitlePlaceholder")}
            disabled={navigating}
            className="w-full rounded-none bg-crust px-5 py-4 text-base text-ink outline-none transition placeholder:text-muted focus:ring-2 focus:ring-burg/30 disabled:opacity-50"
          />

          <div>
            <label className="mb-2 block text-xs uppercase tracking-wider text-soft">
              {t("modalTypeLabel")}
            </label>
            <div className="inline-flex gap-2">
              {(["food", "drink"] as const).map((tp) => (
                <button
                  key={tp}
                  type="button"
                  onClick={() => setType(tp)}
                  disabled={navigating}
                  className={cn(
                    "rounded-none border px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50",
                    type === tp
                      ? "border-burg bg-burg text-paper"
                      : "border-rule bg-transparent text-soft hover:border-burg hover:text-burg",
                  )}
                >
                  {tp === "food" ? t("typeFood") : t("typeDrink")}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="rounded-none bg-red-50 px-4 py-2.5 text-sm text-red-400">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={navigating || !title.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-none bg-burg py-3.5 text-sm font-medium text-paper transition-colors hover:bg-burg-dk disabled:cursor-not-allowed disabled:opacity-40"
            >
              {navigating ? (
                <>
                  <Spinner size="sm" className="text-current" />
                  {t("saving")}
                </>
              ) : (
                t("modalContinue")
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={navigating}
              className="rounded-none border border-rule px-5 py-3.5 text-sm text-soft transition-colors hover:border-burg hover:text-burg disabled:opacity-40"
            >
              {t("cancel")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

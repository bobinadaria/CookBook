"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { PremiumLock, Spinner } from "@/components/ui";
import { fetchWithTimeout, isTimeoutError } from "@/lib/fetch-with-timeout";
import { PENDING_IMPORT_KEY, type ImportedRecipe, type ImportSource } from "@/lib/recipe-import/types";

type Mode = "title" | "link";

/**
 * Быстрое создание рецепта в кабинете: имя ИЛИ ссылка — выбор в самом начале,
 * вместо того чтобы просить название, а ссылку прятать в форме (см.
 * docs/RECIPE_IMPORT_AND_PREMIUM_TEASERS_PLAN.md §2).
 *
 * Режим «Название» — как раньше: переход на `/dashboard/recipes/new?title=…&type=…`,
 * рецепт появляется в БД только после «Сохранить» на самой форме.
 *
 * Режим «Ссылка» — модалка САМА вызывает `/api/recipes/import-url` (Premium/
 * Lifetime; для Free поле заперто через `PremiumLock`), и при успехе кладёт
 * распарсенный рецепт в sessionStorage (см. `PENDING_IMPORT_KEY`) — он не
 * пролезает в query-параметры. `UserRecipeForm` читает и применяет его при
 * маунте. Ошибка показывается прямо здесь, без перехода на страницу формы.
 */
export default function UserQuickCreateModal({
  onClose,
  aiEnabled = false,
}: {
  onClose: () => void;
  aiEnabled?: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("myRecipes");
  const inputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("title");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<"food" | "drink">("food");
  const [navigating, setNavigating] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const busy = navigating || importing;

  // F45: модалка закрывалась, если выделить текст в поле и отпустить мышь за
  // её пределами — `mousedown` внутри инпута + `click`, всплывающий на
  // backdrop при отпускании снаружи, раньше засчитывался как «клик по
  // фону». Закрываем только если И mousedown, И click случились на самом
  // backdrop — без «протаскивания» через границу модалки.
  const mouseDownOnBackdrop = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, [mode]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [busy, onClose]);

  const importErrorMessage = (code?: string): string => {
    switch (code) {
      case "timeout":
        return t("importErrTimeout");
      case "unreachable":
        return t("importErrUnreachable");
      case "js_blocked":
        return t("importErrJsBlocked");
      case "not_recipe":
        return t("importErrNotRecipe");
      default:
        return t("importErrGeneric");
    }
  };

  const handleTitleSubmit = (e: React.FormEvent) => {
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

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed || busy || !aiEnabled) return;
    setImporting(true);
    setError(null);
    try {
      const res = await fetchWithTimeout("/api/recipes/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        recipe?: ImportedRecipe;
        source?: ImportSource;
        code?: string;
      };
      if (!res.ok || !json.recipe) {
        setError(importErrorMessage(json.code));
        setImporting(false);
        return;
      }
      sessionStorage.setItem(
        PENDING_IMPORT_KEY,
        JSON.stringify({ recipe: json.recipe, source: json.source }),
      );
      setNavigating(true);
      router.push("/dashboard/recipes/new");
      // модалка остаётся со спиннером, пока идёт переход
    } catch (err) {
      setError(isTimeoutError(err) ? t("importErrTimeout") : t("importErrGeneric"));
      setImporting(false);
    }
  };

  const modeToggleButton = (m: Mode, label: string) => (
    <button
      key={m}
      type="button"
      onClick={() => {
        setMode(m);
        setError(null);
      }}
      disabled={busy}
      className={cn(
        "rounded-none border px-5 py-2.5 text-sm font-medium transition-colors disabled:opacity-50",
        mode === m
          ? "border-burg bg-burg text-paper"
          : "border-rule bg-transparent text-soft hover:border-burg hover:text-burg",
      )}
    >
      {label}
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      onMouseDown={(e) => {
        mouseDownOnBackdrop.current = e.target === e.currentTarget;
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && mouseDownOnBackdrop.current && !busy) onClose();
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

        {/* Переключатель: имя ИЛИ ссылка — тот же визуальный язык, что у еда/напиток. */}
        <div className="inline-flex gap-2">
          {modeToggleButton("title", t("modalModeTitle"))}
          {modeToggleButton("link", t("modalModeUrl"))}
        </div>

        {mode === "title" ? (
          <form onSubmit={handleTitleSubmit} className="flex flex-col gap-4">
            <input
              ref={inputRef}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError(null);
              }}
              placeholder={t("fieldTitlePlaceholder")}
              disabled={busy}
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
                    disabled={busy}
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
                disabled={busy || !title.trim()}
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
                disabled={busy}
                className="rounded-none border border-rule px-5 py-3.5 text-sm text-soft transition-colors hover:border-burg hover:text-burg disabled:opacity-40"
              >
                {t("cancel")}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLinkSubmit} className="flex flex-col gap-4">
            <PremiumLock locked={!aiEnabled}>
              <div className="flex flex-col gap-4">
                <input
                  ref={inputRef}
                  type="url"
                  inputMode="url"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    setError(null);
                  }}
                  placeholder={t("importPlaceholder")}
                  disabled={busy}
                  className="w-full rounded-none bg-crust px-5 py-4 text-base text-ink outline-none transition placeholder:text-muted focus:ring-2 focus:ring-burg/30 disabled:opacity-50"
                />
                {error && (
                  <p className="rounded-none bg-red-50 px-4 py-2.5 text-sm text-red-400">{error}</p>
                )}
                <button
                  type="submit"
                  disabled={busy || !url.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-none bg-burg py-3.5 text-sm font-medium text-paper transition-colors hover:bg-burg-dk disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {importing || navigating ? (
                    <>
                      <Spinner size="sm" className="text-current" />
                      {t("importLoading")}
                    </>
                  ) : (
                    t("importButton")
                  )}
                </button>
              </div>
            </PremiumLock>

            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="self-start rounded-none border border-rule px-5 py-3.5 text-sm text-soft transition-colors hover:border-burg hover:text-burg disabled:opacity-40"
            >
              {t("cancel")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

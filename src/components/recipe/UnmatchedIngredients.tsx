"use client";

/**
 * Блок «Не нашли в базе» — показывается в формах рецепта (админ + юзер) после
 * расчёта КБЖУ, если AI-парсер выдал ингредиенты, которых нет в ingredients_base.
 *
 * Для каждого ненайденного — top-3 кандидата по similarity + опциональная AI-оценка
 * макросов (для подсветки «±N%»). Юзер выбирает: считать как X / выбрать вручную /
 * пропустить из расчёта. Решение сохраняется через POST /api/recipes/resolve-alias,
 * рецепт пересчитывается, новый nutrition прилетает обратно — мы зовём onResolved.
 *
 * Решения копятся в ingredient_aliases (per-user), так что в следующих рецептах
 * та же стрэчателла молча сматчится на моцареллу без вопроса.
 */
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { fetchWithTimeout, isTimeoutError } from "@/lib/fetch-with-timeout";
import type {
  IngredientSuggestion,
  NutritionData,
  UnmatchedIngredient,
} from "@/types";

interface Props {
  unmatched: UnmatchedIngredient[];
  /** Текст состава рецепта (для recalc после применения алиаса). */
  ingredientsText: string;
  /** Число порций (для recalc). */
  servings: number | null;
  /** Колбэк после resolve-alias: фронт обновляет nutrition в форме. */
  onResolved: (nutrition: NutritionData) => void;
}

export default function UnmatchedIngredients({
  unmatched,
  ingredientsText,
  servings,
  onResolved,
}: Props) {
  const t = useTranslations("recipe.unmatched");
  const [resolvingFor, setResolvingFor] = useState<string | null>(null);
  const [requestedFor, setRequestedFor] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pickingFor, setPickingFor] = useState<UnmatchedIngredient | null>(null);

  async function resolve(
    aliasText: string,
    opts:
      | { type: "canonical"; id: string }
      | { type: "skip" }
      | { type: "ai_estimate"; macros: { kcal_100g: number; protein_100g: number; fat_100g: number; carbs_100g: number } },
  ) {
    setResolvingFor(aliasText);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        alias_text: aliasText,
        ingredients_text: ingredientsText,
        servings,
      };
      if (opts.type === "canonical") body.canonical_ingredient_id = opts.id;
      else if (opts.type === "skip") body.is_skip = true;
      else if (opts.type === "ai_estimate") body.ai_estimate = opts.macros;

      const res = await fetchWithTimeout("/api/recipes/resolve-alias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || t("error"));
        return;
      }
      if (json.nutrition) {
        onResolved(json.nutrition as NutritionData);
      }
    } catch (e) {
      setError(isTimeoutError(e) ? t("timeout") : e instanceof Error ? e.message : String(e));
    } finally {
      setResolvingFor(null);
    }
  }

  async function requestIngredient(u: UnmatchedIngredient) {
    try {
      await fetch("/api/recipes/request-ingredient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          original_text: u.original_text,
          parsed_name: u.parsed_name,
        }),
      });
      setRequestedFor((prev) => new Set([...prev, u.parsed_name]));
    } catch {
      // Молча игнорируем — запрос некритичен
    }
  }

  if (unmatched.length === 0) return null;

  return (
    <section className="bg-ochre/10 border border-ochre/30 rounded-none p-5">
      <p className="text-xs uppercase tracking-wider text-ochre-dk mb-1">
        {t("title", { count: unmatched.length })}
      </p>
      <p className="text-xs text-soft mb-4">{t("subtitle")}</p>

      <div className="space-y-4">
        {unmatched.map((u) => (
          <UnmatchedRow
            key={u.parsed_name + u.quantity_g}
            u={u}
            resolving={resolvingFor === u.parsed_name}
            requested={requestedFor.has(u.parsed_name)}
            onCountAs={(id) => resolve(u.parsed_name, { type: "canonical", id })}
            onSkip={() => resolve(u.parsed_name, { type: "skip" })}
            onPickOther={() => setPickingFor(u)}
            onUseAiEstimate={(macros) => resolve(u.parsed_name, { type: "ai_estimate", macros })}
            onRequest={() => requestIngredient(u)}
          />
        ))}
      </div>

      {error && (
        <p className="mt-3 text-xs text-burg bg-burg/5 px-3 py-2">{error}</p>
      )}

      {pickingFor && (
        <IngredientPickerModal
          target={pickingFor}
          onPick={(id) => {
            const target = pickingFor;
            setPickingFor(null);
            resolve(target.parsed_name, { type: "canonical", id });
          }}
          onClose={() => setPickingFor(null)}
        />
      )}
    </section>
  );
}

// ── Один ингредиент с suggestions ──────────────────────────────────────────

function UnmatchedRow({
  u,
  resolving,
  requested,
  onCountAs,
  onSkip,
  onPickOther,
  onUseAiEstimate,
  onRequest,
}: {
  u: UnmatchedIngredient;
  resolving: boolean;
  requested: boolean;
  onCountAs: (id: string) => void;
  onSkip: () => void;
  onPickOther: () => void;
  onUseAiEstimate: (macros: { kcal_100g: number; protein_100g: number; fat_100g: number; carbs_100g: number }) => void;
  onRequest: () => void;
}) {
  const t = useTranslations("recipe.unmatched");
  const topSuggestion = u.suggestions[0] ?? null;
  const hasGoodSuggestion = topSuggestion && topSuggestion.similarity >= 0.3;
  const hasEstimate = !!u.estimate && u.estimate.kcal_100g > 0;

  return (
    <div className="border-t border-ochre/30 pt-3 first:border-t-0 first:pt-0">
      <p className="text-sm text-ink mb-2">
        <span className="font-medium">«{u.parsed_name}»</span>{" "}
        <span className="text-soft">— {Math.round(u.quantity_g)} г</span>
      </p>

      {hasGoodSuggestion ? (
        <div className="mb-3">
          <p className="text-xs text-soft mb-1.5">{t("similar")}:</p>
          <SuggestionLine suggestion={topSuggestion} estimate={u.estimate} />
        </div>
      ) : (
        <p className="text-xs text-soft mb-3">{t("noSuggestions")}</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {hasGoodSuggestion && (
          <button
            type="button"
            onClick={() => onCountAs(topSuggestion.ingredient_id)}
            disabled={resolving}
            className={cn(
              "rounded-none border px-3 py-1.5 text-xs transition-colors",
              "border-burg bg-burg text-paper hover:bg-burg-dk",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            {resolving && <Spinner size="sm" className="inline-block mr-1" />}
            {t("countAs", { name: topSuggestion.name_ru })}
          </button>
        )}

        <button
          type="button"
          onClick={onPickOther}
          disabled={resolving}
          className={cn(
            "rounded-none border px-3 py-1.5 text-xs transition-colors",
            "border-rule bg-paper text-ink hover:border-burg",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          {hasGoodSuggestion ? t("chooseOther") : t("chooseManually")}
        </button>

        {/* AI-оценка: кнопка есть, если парсер вернул estimate по этому ингредиенту */}
        {hasEstimate && (
          <button
            type="button"
            onClick={() => onUseAiEstimate(u.estimate!)}
            disabled={resolving}
            className={cn(
              "rounded-none border px-3 py-1.5 text-xs transition-colors",
              "border-ochre/60 bg-ochre/5 text-ochre-dk hover:bg-ochre/15",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            {t("useAiEstimate", { kcal: Math.round(u.estimate!.kcal_100g) })}
          </button>
        )}

        <button
          type="button"
          onClick={onSkip}
          disabled={resolving}
          className={cn(
            "rounded-none border px-3 py-1.5 text-xs transition-colors",
            "border-rule bg-paper text-soft hover:text-burg",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          {t("skip")}
        </button>

        {/* Кнопка запроса — всегда видна, один раз */}
        {!requested ? (
          <button
            type="button"
            onClick={onRequest}
            disabled={resolving}
            className={cn(
              "rounded-none border px-3 py-1.5 text-xs transition-colors",
              "border-rule bg-paper text-muted hover:text-soft",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          >
            {t("requestAdd")}
          </button>
        ) : (
          <span className="text-xs text-olive">{t("requestSent")}</span>
        )}
      </div>
    </div>
  );
}

// ── Карточка одной подсказки (с дельтой если есть AI-estimate) ───────────

function SuggestionLine({
  suggestion,
  estimate,
}: {
  suggestion: IngredientSuggestion;
  estimate?: UnmatchedIngredient["estimate"];
}) {
  const t = useTranslations("recipe.unmatched");

  // Дельта kcal vs AI-оценки. Положительная = замена калорийнее.
  let diffLabel: string | null = null;
  if (estimate && estimate.kcal_100g > 0) {
    const pct = Math.round(
      ((suggestion.kcal_100g - estimate.kcal_100g) / estimate.kcal_100g) * 100,
    );
    const sign = pct >= 0 ? "+" : "";
    diffLabel = t("diff", { sign, pct: Math.abs(pct).toString() });
  }

  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
      <span className="font-medium text-ink">{suggestion.name_ru}</span>
      <span className="text-xs text-soft">
        {Math.round(suggestion.kcal_100g)} {t("kcalUnit")}
      </span>
      {suggestion.category && (
        <span className="text-[10px] uppercase tracking-wider text-muted">
          {suggestion.category}
        </span>
      )}
      {diffLabel && (
        <span className="text-xs text-ochre-dk">{diffLabel}</span>
      )}
    </div>
  );
}

// ── Модалка «выбери из всей базы» ───────────────────────────────────────────

interface PickerRow {
  id: string;
  name_ru: string;
  name_en: string | null;
  category: string | null;
  kcal_100g: number;
}

function IngredientPickerModal({
  target,
  onPick,
  onClose,
}: {
  target: UnmatchedIngredient;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const t = useTranslations("recipe.unmatched.modal");
  const [query, setQuery] = useState(target.parsed_name);
  const [results, setResults] = useState<PickerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Закрытие по Esc.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    inputRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Поиск с дебаунсом.
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const id = window.setTimeout(async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc("match_ingredient_top_n", {
          query: query.trim(),
          top_n: 30,
          threshold: 0.0,
        });
        if (error) {
          console.warn("[picker] search:", error.message);
          setResults([]);
        } else {
          setResults(
            (data ?? []).map((r: PickerRow & { similarity?: number }) => ({
              id: r.id,
              name_ru: r.name_ru,
              name_en: r.name_en,
              category: r.category,
              kcal_100g: r.kcal_100g,
            })),
          );
        }
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => window.clearTimeout(id);
  }, [query, supabase]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-paper border border-rule rounded-none p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs uppercase tracking-wider text-soft mb-1">
          {t("title", { name: target.parsed_name })}
        </p>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("search")}
          className="w-full bg-crust border border-rule rounded-none px-4 py-2.5 text-sm text-ink outline-none focus:ring-2 focus:ring-burg/30 transition mb-3"
        />
        <div className="max-h-72 overflow-y-auto border border-rule">
          {loading ? (
            <div className="flex items-center gap-2 p-4 text-xs text-soft">
              <Spinner size="sm" /> …
            </div>
          ) : results.length === 0 ? (
            <p className="p-4 text-xs text-soft">{t("noResults")}</p>
          ) : (
            <ul>
              {results.map((r) => (
                <li
                  key={r.id}
                  className="border-b border-rule last:border-b-0 hover:bg-crust/60"
                >
                  <button
                    type="button"
                    onClick={() => onPick(r.id)}
                    className="w-full text-left px-3 py-2.5"
                  >
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm text-ink truncate">
                        {r.name_ru}
                      </span>
                      <span className="text-xs text-soft shrink-0">
                        {Math.round(r.kcal_100g)} ккал/100 г
                      </span>
                    </div>
                    {r.category && (
                      <p className="text-[10px] uppercase tracking-wider text-muted mt-0.5">
                        {r.category}
                      </p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-none border border-rule bg-paper text-soft hover:text-burg px-4 py-2 text-xs transition-colors"
          >
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}

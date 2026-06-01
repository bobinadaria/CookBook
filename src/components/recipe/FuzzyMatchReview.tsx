"use client";

/**
 * FuzzyMatchReview — дружелюбный блок для согласования fuzzy-матчей КБЖУ.
 *
 * Показывается в UserRecipeForm после расчёта КБЖУ, если AI нашёл
 * похожие — но не точные — совпадения для ингредиентов пользователя.
 *
 * Для каждого fuzzy-матча:
 *   – Что написал пользователь → что AI засчитал
 *   – Кнопка «Подходит» — сохраняет алиас, рецепт пересчитывается
 *   – Кнопка «Заменить» — открывает пикер из всей базы
 *
 * Решение запоминается в ingredient_aliases, поэтому в следующих рецептах
 * тот же ингредиент сматчится молча и правильно.
 */

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import type { NutritionData, NutritionMatch } from "@/types";

interface FuzzyMatchReviewProps {
  /** Все ингредиенты из nutrition.ingredients — фильтруем fuzzy внутри. */
  ingredients: NutritionMatch[];
  ingredientsText: string;
  servings: number | null;
  onResolved: (nutrition: NutritionData) => void;
}

// Порог: показываем fuzzy-матчи с similarity НИЖЕ этого значения.
// Высококонфидентные (≥ 0.85) принимаем молча.
const SHOW_THRESHOLD = 0.85;

export default function FuzzyMatchReview({
  ingredients,
  ingredientsText,
  servings,
  onResolved,
}: FuzzyMatchReviewProps) {
  const t = useTranslations("recipe.fuzzy");

  const fuzzyMatches = ingredients.filter(
    (m) =>
      m.match_type === "fuzzy" &&
      m.matched_id &&
      (m.similarity == null || m.similarity < SHOW_THRESHOLD),
  );

  const [resolvingFor, setResolvingFor] = useState<string | null>(null);
  const [resolvedInputs, setResolvedInputs] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pickingFor, setPickingFor] = useState<NutritionMatch | null>(null);

  async function resolveAlias(
    aliasText: string,
    canonicalIngredientId: string | null,
    isSkip: boolean,
  ) {
    setResolvingFor(aliasText);
    setError(null);
    try {
      const res = await fetch("/api/recipes/resolve-alias", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alias_text: aliasText,
          canonical_ingredient_id: canonicalIngredientId ?? undefined,
          is_skip: isSkip,
          ingredients_text: ingredientsText,
          servings,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || t("error"));
        return;
      }
      setResolvedInputs((prev) => new Set([...prev, aliasText]));
      if (json.nutrition) {
        onResolved(json.nutrition as NutritionData);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setResolvingFor(null);
    }
  }

  const remaining = fuzzyMatches.filter((m) => !resolvedInputs.has(m.input));

  if (fuzzyMatches.length === 0) return null;

  const doneCount = fuzzyMatches.length - remaining.length;
  const allDone = remaining.length === 0;

  if (allDone) {
    return (
      <div className="border border-olive/30 bg-olive/5 px-4 py-3 flex items-center gap-2">
        <span className="text-olive">✓</span>
        <p className="text-xs text-soft">{t("allDone")}</p>
      </div>
    );
  }

  return (
    <section className="border border-ochre/30 bg-ochre/[0.06] rounded-none">
      {/* Шапка */}
      <div className="px-5 pt-5 pb-4 border-b border-ochre/20">
        <p className="text-xs uppercase tracking-wider text-ochre-dk mb-1">
          {t("title", { count: remaining.length })}
        </p>
        <p className="text-xs text-soft leading-relaxed">{t("subtitle")}</p>
        {doneCount > 0 && (
          <p className="mt-1.5 text-xs text-olive">
            {t("progress", { done: doneCount, total: fuzzyMatches.length })}
          </p>
        )}
      </div>

      {/* Список матчей */}
      <div className="divide-y divide-ochre/15">
        {remaining.map((m) => (
          <FuzzyMatchRow
            key={m.input}
            match={m}
            resolving={resolvingFor === m.input}
            onConfirm={() => resolveAlias(m.input, m.matched_id!, false)}
            onReplace={() => setPickingFor(m)}
          />
        ))}
      </div>

      {error && (
        <div className="px-5 pb-4 pt-1">
          <p className="text-xs text-burg bg-burg/5 px-3 py-2">{error}</p>
        </div>
      )}

      {pickingFor && (
        <FuzzyIngredientPicker
          target={pickingFor}
          onPick={(id) => {
            const target = pickingFor;
            setPickingFor(null);
            resolveAlias(target.input, id, false);
          }}
          onClose={() => setPickingFor(null)}
        />
      )}
    </section>
  );
}

// ── Одна строка ────────────────────────────────────────────────────────────

function FuzzyMatchRow({
  match,
  resolving,
  onConfirm,
  onReplace,
}: {
  match: NutritionMatch;
  resolving: boolean;
  onConfirm: () => void;
  onReplace: () => void;
}) {
  const t = useTranslations("recipe.fuzzy");

  return (
    <div className="px-5 py-4">
      {/* Что написал → что нашли */}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mb-3">
        <span className="text-sm font-medium text-ink">«{match.input}»</span>
        <span className="text-soft">→</span>
        <span className="text-sm font-medium text-burg">«{match.matched}»</span>
        {match.kcal != null && match.grams > 0 && (
          <span className="text-[11px] text-muted">
            {Math.round((match.kcal / match.grams) * 100)} {t("kcalUnit")}
          </span>
        )}
      </div>

      {/* Кнопки */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={resolving}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-none border px-3 py-1.5 text-xs font-medium transition-colors",
            "border-burg bg-burg text-paper hover:bg-burg-dk",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          {resolving ? (
            <Spinner size="sm" className="inline-block" />
          ) : (
            "✓"
          )}
          {t("confirm", { name: match.matched ?? "" })}
        </button>

        <button
          type="button"
          onClick={onReplace}
          disabled={resolving}
          className={cn(
            "rounded-none border px-3 py-1.5 text-xs transition-colors",
            "border-rule bg-paper text-ink hover:border-burg hover:text-burg",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          {t("replace")}
        </button>
      </div>
    </div>
  );
}

// ── Пикер ─────────────────────────────────────────────────────────────────

interface PickerRow {
  id: string;
  name_ru: string;
  category: string | null;
  kcal_100g: number;
}

function FuzzyIngredientPicker({
  target,
  onPick,
  onClose,
}: {
  target: NutritionMatch;
  onPick: (id: string) => void;
  onClose: () => void;
}) {
  const t = useTranslations("recipe.fuzzy.modal");
  const [query, setQuery] = useState(target.matched ?? target.input);
  const [results, setResults] = useState<PickerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  // Закрытие по Esc
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    inputRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Поиск с дебаунсом
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
          console.warn("[fuzzy-picker]", error.message);
          setResults([]);
        } else {
          setResults(
            (data ?? []).map((r: PickerRow) => ({
              id: r.id,
              name_ru: r.name_ru,
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
          {t("title", { name: target.input })}
        </p>
        <p className="text-xs text-muted mb-3">
          {t("currentMatch", { name: target.matched ?? "" })}
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
                      <span className="text-sm text-ink truncate">{r.name_ru}</span>
                      <span className="text-xs text-soft shrink-0">
                        {Math.round(r.kcal_100g)} {t("kcalUnit")}
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

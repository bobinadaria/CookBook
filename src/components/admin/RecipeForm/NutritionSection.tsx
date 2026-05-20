"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui";
import type { NutritionData } from "@/types";

interface NutritionSectionProps {
  /** Текущая (последняя сохранённая) nutrition. Null если ещё не считали. */
  current: NutritionData | null;
  /** Свежий результат после нажатия кнопки. Перетирает current до сохранения. */
  fresh: NutritionData | null;
  recipeId?: string;
  ingredientsEmpty: boolean;
  /** Текущий текст ingredients ≠ сохранённый → предупреждение. */
  ingredientsDirty: boolean;
  calculating: boolean;
  error: string | null;
  onCalculate: () => void;
}

function StatBox({
  label,
  value,
  unit,
  size = "md",
}: {
  label: string;
  value: number;
  unit: string;
  size?: "md" | "lg";
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wider text-charcoal/40">
        {label}
      </span>
      <span
        className={cn(
          "font-serif text-charcoal",
          size === "lg" ? "text-3xl" : "text-xl",
        )}
      >
        {value}
        <span className="text-xs text-charcoal/40 ml-1 font-sans">{unit}</span>
      </span>
    </div>
  );
}

export default function NutritionSection({
  current,
  fresh,
  recipeId,
  ingredientsEmpty,
  ingredientsDirty,
  calculating,
  error,
  onCalculate,
}: NutritionSectionProps) {
  const [showDetails, setShowDetails] = useState(false);

  const display = fresh ?? current;
  const disabled = !recipeId || ingredientsEmpty || calculating;
  const isFresh = fresh !== null;

  return (
    <section>
      <label className="block text-xs text-charcoal/40 uppercase tracking-wider mb-3">
        КБЖУ (AI-расчёт)
      </label>

      {/* ── Result display ──────────────────────────────────────────────── */}
      {display ? (
        <div className="bg-sand/60 rounded-2xl p-5 mb-3">
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-sm text-charcoal/60">
              На 1 порцию ({display.servings}{" "}
              {display.servings === 1 ? "порция" : "порций"})
            </span>
            <ConfidenceBadge value={display.confidence} />
          </div>

          <div className="grid grid-cols-4 gap-4 mb-4">
            <StatBox label="ккал" value={display.per_serving.kcal} unit="" size="lg" />
            <StatBox label="белки" value={display.per_serving.protein} unit="г" />
            <StatBox label="жиры" value={display.per_serving.fat} unit="г" />
            <StatBox label="углеводы" value={display.per_serving.carbs} unit="г" />
          </div>

          <div className="text-xs text-charcoal/50 border-t border-charcoal/10 pt-3 flex justify-between">
            <span>
              На весь рецепт ({display.total.weight_g} г): {display.total.kcal} ккал
            </span>
            <span className="text-charcoal/30">
              {new Date(display.calculated_at).toLocaleString("ru-RU", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>

          {display.warnings.length > 0 && (
            <div className="mt-3 space-y-1.5">
              {display.warnings.map((w, i) => (
                <p
                  key={i}
                  className="text-xs text-peach-dark bg-peach/10 rounded-lg px-3 py-2"
                >
                  ⚠ {w}
                </p>
              ))}
            </div>
          )}

          {isFresh && (
            <p className="mt-3 text-xs text-sage-dark">
              ✓ Сохранено в БД. Это свежий результат.
            </p>
          )}

          <button
            type="button"
            onClick={() => setShowDetails((s) => !s)}
            className="mt-3 text-xs text-charcoal/40 hover:text-charcoal/70 transition-colors"
          >
            {showDetails ? "Скрыть разбор по ингредиентам" : "Показать разбор по ингредиентам"}
          </button>

          {showDetails && (
            <div className="mt-3 text-xs font-mono space-y-1 max-h-72 overflow-y-auto">
              {display.ingredients.map((m, i) => {
                const tag =
                  m.match_type === "exact"
                    ? "✓"
                    : m.match_type === "fuzzy"
                    ? `~${m.similarity?.toFixed(2)}`
                    : "✗";
                const right = m.matched
                  ? `${m.grams}г → ${m.matched} = ${m.kcal} ккал`
                  : m.grams > 0
                  ? `${m.grams}г → не найдено`
                  : "пропущено";
                return (
                  <div key={i} className="flex gap-3 text-charcoal/70">
                    <span
                      className={cn(
                        "shrink-0 w-12",
                        m.match_type === "unknown" && m.grams > 0
                          ? "text-red-500"
                          : m.match_type === "fuzzy"
                          ? "text-peach-dark"
                          : "text-sage-dark",
                      )}
                    >
                      {tag}
                    </span>
                    <span className="flex-1 truncate" title={m.input}>
                      {m.input}
                    </span>
                    <span className="text-charcoal/50 shrink-0">{right}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-charcoal/40 mb-3">
          Пока не рассчитано. Нажми кнопку ниже — gpt-4o-mini распарсит ингредиенты и сматчит с базой.
        </p>
      )}

      {/* ── Action button + hints ───────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={onCalculate}
          disabled={disabled}
          className={cn(
            "inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed",
            "bg-peach/10 text-peach hover:bg-peach/20 border border-peach/20",
          )}
        >
          {calculating ? (
            <>
              <Spinner size="sm" className="text-current" />
              Считаем КБЖУ… это займёт ~10-20 сек
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.8}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25"
                />
              </svg>
              {display ? "Пересчитать КБЖУ" : "Рассчитать КБЖУ"}
            </>
          )}
        </button>

        {!recipeId && (
          <span className="text-xs text-charcoal/40">
            Сначала сохрани рецепт — без id нечего считать
          </span>
        )}
        {recipeId && ingredientsEmpty && (
          <span className="text-xs text-charcoal/40">
            Заполни поле «Состав / Ингредиенты»
          </span>
        )}
        {recipeId && !ingredientsEmpty && ingredientsDirty && (
          <span className="text-xs text-peach-dark">
            ⚠ Несохранённые изменения в составе не будут учтены — сохрани сначала
          </span>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-400 bg-red-50 rounded-xl px-4 py-3">
          {error}
        </p>
      )}
    </section>
  );
}

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const colorClass =
    value >= 0.85
      ? "bg-sage/20 text-sage-dark"
      : value >= 0.5
      ? "bg-peach/15 text-peach-dark"
      : "bg-red-50 text-red-500";
  return (
    <span className={cn("text-xs px-2.5 py-1 rounded-full font-medium", colorClass)}>
      Уверенность {pct}%
    </span>
  );
}

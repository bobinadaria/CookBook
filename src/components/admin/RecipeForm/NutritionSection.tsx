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
  ingredientsEmpty: boolean;
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
      <span className="text-[10px] uppercase tracking-wider text-soft">
        {label}
      </span>
      <span
        className={cn(
          "font-display text-ink",
          size === "lg" ? "text-3xl" : "text-xl",
        )}
      >
        {value}
        <span className="text-xs text-soft ml-1 font-body">{unit}</span>
      </span>
    </div>
  );
}

export default function NutritionSection({
  current,
  fresh,
  ingredientsEmpty,
  calculating,
  error,
  onCalculate,
}: NutritionSectionProps) {
  const [showDetails, setShowDetails] = useState(false);

  const display = fresh ?? current;
  const disabled = ingredientsEmpty || calculating;
  const isFresh = fresh !== null;

  return (
    <section>
      <label className="block text-xs text-soft uppercase tracking-wider mb-3">
        КБЖУ (AI-расчёт)
      </label>

      {/* ── Result display ──────────────────────────────────────────────── */}
      {display ? (
        <div className="bg-crust/60 rounded-none p-5 mb-3">
          <div className="flex items-baseline justify-between mb-3">
            <span className="text-sm text-soft">
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

          <div className="text-xs text-soft border-t border-rule pt-3 flex justify-between">
            <span>
              На весь рецепт ({display.total.weight_g} г): {display.total.kcal} ккал
            </span>
            <span className="text-muted">
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
                  className="text-xs text-ochre-dk bg-ochre/10 rounded-none px-3 py-2"
                >
                  ⚠ {w}
                </p>
              ))}
            </div>
          )}

          {isFresh && (
            <p className="mt-3 text-xs text-olive">
              ✓ Посчитано. Сохранится вместе с рецептом.
            </p>
          )}

          <button
            type="button"
            onClick={() => setShowDetails((s) => !s)}
            className="mt-3 text-xs text-soft hover:text-burg transition-colors"
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
                  <div key={i} className="flex gap-3 text-soft">
                    <span
                      className={cn(
                        "shrink-0 w-12",
                        m.match_type === "unknown" && m.grams > 0
                          ? "text-red-500"
                          : m.match_type === "fuzzy"
                          ? "text-ochre-dk"
                          : "text-olive",
                      )}
                    >
                      {tag}
                    </span>
                    <span className="flex-1 truncate" title={m.input}>
                      {m.input}
                    </span>
                    <span className="text-soft shrink-0">{right}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-soft mb-3">
          Пока не рассчитано. Нажми кнопку ниже — посчитаем КБЖУ по составу.
        </p>
      )}

      {/* ── Action button + hints ───────────────────────────────────────── */}
      {/* Считается прямо по тексту состава, без сохранения (как в пользовательской
          форме): результат сохранится вместе с рецептом. */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={onCalculate}
          disabled={disabled}
          className={cn(
            "inline-flex items-center gap-2 px-6 py-3 rounded-none text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed",
            "bg-ochre/10 text-ochre-dk hover:bg-ochre/20 border border-ochre/30",
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

        {ingredientsEmpty && (
          <span className="text-xs text-soft">
            Заполни поле «Состав / Ингредиенты»
          </span>
        )}
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-400 bg-red-50 rounded-none px-4 py-3">
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
      ? "bg-olive/15 text-olive"
      : value >= 0.5
      ? "bg-ochre/15 text-ochre-dk"
      : "bg-red-50 text-red-500";
  return (
    <span className={cn("text-xs px-2.5 py-1 rounded-none font-medium", colorClass)}>
      Уверенность {pct}%
    </span>
  );
}

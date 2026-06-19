"use client";

/**
 * NutritionResolveModal — пошаговое разрешение «спорных» ингредиентов КБЖУ.
 *
 * Заменяет два прежних inline-блока (FuzzyMatchReview + UnmatchedIngredients),
 * которые терялись на странице. Вместо них — одно модальное окно в стиле
 * вопросов Cowork: фокус на одном ингредиенте, варианты кнопками, счётчик
 * «N из M» в углу и «Выбрать за меня».
 *
 * Что считается «спорным» (попадает в очередь):
 *   – слабый fuzzy-матч (similarity < 0.85) — спрашиваем «правильно ли засчитали»;
 *   – не нашли в базе — даём AI-оценку / не учитывать / запросить добавление.
 * Уверенные совпадения (exact / alias / fuzzy ≥ 0.85) сюда НЕ попадают —
 * считаются молча.
 *
 * Производительность: каждое решение сохраняется как алиас БЫСТРО (без пересчёта,
 * без обращения к OpenAI), а полный пересчёт КБЖУ делается ОДИН раз в конце.
 */

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { fetchWithTimeout, isTimeoutError } from "@/lib/fetch-with-timeout";
import type { IngredientSuggestion, NutritionData, NutritionMatch } from "@/types";

const SHOW_THRESHOLD = 0.85; // fuzzy выше — принимаем молча, не спрашиваем

type Macros = {
  kcal_100g: number;
  protein_100g: number;
  fat_100g: number;
  carbs_100g: number;
};

interface FuzzyStep {
  kind: "fuzzy";
  aliasText: string; // parsed-имя — ключ алиаса
  input: string; // сырая строка для показа
  grams: number;
  matchedName: string;
  matchedId: string;
  kcalContribution: number | null;
}
interface UnmatchedStep {
  kind: "unmatched";
  aliasText: string;
  input: string;
  grams: number;
  suggestions: IngredientSuggestion[];
  estimate?: Macros;
}
type Step = FuzzyStep | UnmatchedStep;

interface Props {
  nutrition: NutritionData;
  ingredientsText: string;
  servings: number | null;
  onResolved: (n: NutritionData) => void;
  onClose: () => void;
}

/** Строит очередь спорных шагов из результата расчёта. */
export function buildResolveQueue(nutrition: NutritionData | null | undefined): Step[] {
  if (!nutrition) return [];
  const steps: Step[] = [];

  for (const m of nutrition.ingredients as NutritionMatch[]) {
    if (
      m.match_type === "fuzzy" &&
      m.matched_id &&
      (m.similarity == null || m.similarity < SHOW_THRESHOLD)
    ) {
      steps.push({
        kind: "fuzzy",
        aliasText: m.parsed_name || m.input,
        input: m.input,
        grams: m.grams,
        matchedName: m.matched ?? "",
        matchedId: m.matched_id,
        kcalContribution: m.kcal,
      });
    }
  }

  for (const u of nutrition.unmatched ?? []) {
    steps.push({
      kind: "unmatched",
      aliasText: u.parsed_name,
      input: u.original_text,
      grams: u.quantity_g,
      suggestions: u.suggestions,
      estimate:
        u.estimate && u.estimate.kcal_100g > 0
          ? {
              kcal_100g: u.estimate.kcal_100g,
              protein_100g: u.estimate.protein_100g,
              fat_100g: u.estimate.fat_100g,
              carbs_100g: u.estimate.carbs_100g,
            }
          : undefined,
    });
  }

  return steps;
}

type Decision =
  | { type: "canonical"; id: string }
  | { type: "skip" }
  | { type: "ai_estimate"; macros: Macros };

export default function NutritionResolveModal({
  nutrition,
  ingredientsText,
  servings,
  onResolved,
  onClose,
}: Props) {
  const t = useTranslations("recipe.resolve");

  // Очередь фиксируем один раз при открытии (по index идём дальше).
  const [queue] = useState<Step[]>(() => buildResolveQueue(nutrition));
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requested, setRequested] = useState<Set<string>>(new Set());
  const [pickingOther, setPickingOther] = useState(false);

  const total = queue.length;
  const step = queue[index] ?? null;

  // Esc = «выбрать за меня для всех оставшихся».
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy && !finalizing) autoFinishAll();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy, finalizing, index]);

  if (total === 0) return null;

  /** Сохраняет одно решение как алиас — БЕЗ пересчёта (быстро). */
  async function persist(aliasText: string, d: Decision): Promise<void> {
    const body: Record<string, unknown> = { alias_text: aliasText };
    if (d.type === "canonical") body.canonical_ingredient_id = d.id;
    else if (d.type === "skip") body.is_skip = true;
    else body.ai_estimate = d.macros;
    const res = await fetchWithTimeout("/api/recipes/resolve-alias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || t("error"));
    }
  }

  /** Финальный пересчёт КБЖУ один раз — применяет все сохранённые алиасы. */
  async function finalize() {
    setFinalizing(true);
    setError(null);
    try {
      const res = await fetchWithTimeout("/api/recipes/calculate-nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: ingredientsText, servings }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(j.error || t("error"));
        setFinalizing(false);
        return;
      }
      onResolved(j.nutrition as NutritionData);
      onClose();
    } catch (e) {
      setError(isTimeoutError(e) ? t("timeout") : t("error"));
      setFinalizing(false);
    }
  }

  /** Применить решение к текущему шагу и пойти дальше (или финализировать). */
  async function decide(d: Decision) {
    if (!step || busy) return;
    setBusy(true);
    setError(null);
    try {
      await persist(step.aliasText, d);
      setPickingOther(false);
      if (index + 1 >= total) {
        await finalize();
      } else {
        setIndex((i) => i + 1);
      }
    } catch (e) {
      setError(isTimeoutError(e) ? t("timeout") : e instanceof Error ? e.message : t("error"));
    } finally {
      setBusy(false);
    }
  }

  /** Лучшая авто-догадка для шага. */
  function autoDecision(s: Step): Decision {
    if (s.kind === "fuzzy") return { type: "canonical", id: s.matchedId };
    const top = s.suggestions[0];
    if (top && top.similarity >= 0.3) return { type: "canonical", id: top.ingredient_id };
    if (s.estimate) return { type: "ai_estimate", macros: s.estimate };
    return { type: "skip" };
  }

  /** «Выбрать за меня» для текущего шага. */
  async function autoCurrent() {
    if (!step) return;
    await decide(autoDecision(step));
  }

  /** «Выбрать за меня» для всех оставшихся (Esc / крестик). */
  async function autoFinishAll() {
    if (busy || finalizing) return;
    setBusy(true);
    setError(null);
    try {
      for (let i = index; i < total; i++) {
        await persist(queue[i].aliasText, autoDecision(queue[i]));
      }
      await finalize();
    } catch (e) {
      setError(isTimeoutError(e) ? t("timeout") : e instanceof Error ? e.message : t("error"));
      setBusy(false);
    }
  }

  async function sendRequest(s: Step) {
    try {
      await fetchWithTimeout("/api/recipes/request-ingredient", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ original_text: s.input, parsed_name: s.aliasText }),
      });
      setRequested((prev) => new Set([...prev, s.aliasText]));
    } catch {
      /* запрос некритичен — молча игнорируем */
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
      <div className="w-full max-w-md border border-rule bg-paper rounded-none shadow-none">
        {/* Шапка: счётчик + закрыть */}
        <div className="flex items-center justify-between border-b border-rule px-5 py-3">
          <span className="font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-soft">
            {t("counter", { current: Math.min(index + 1, total), total })}
          </span>
          <button
            type="button"
            onClick={autoFinishAll}
            disabled={busy || finalizing}
            className="font-body text-[11px] uppercase tracking-[0.13em] text-soft transition-colors hover:text-burg disabled:opacity-40"
          >
            {t("close")}
          </button>
        </div>

        <div className="px-5 py-5">
          {finalizing ? (
            <div className="flex items-center gap-2 py-6 text-sm text-soft">
              <Spinner size="sm" /> {t("finalizing")}
            </div>
          ) : step ? (
            pickingOther ? (
              <SearchPicker
                target={step}
                onPick={(id) => decide({ type: "canonical", id })}
                onBack={() => setPickingOther(false)}
                busy={busy}
              />
            ) : (
              <>
                {/* Вопрос */}
                <p className="mb-1 font-display text-[20px] leading-snug text-burg">
                  {step.kind === "fuzzy"
                    ? t("fuzzyQuestion", { name: step.input })
                    : t("notFoundQuestion", { name: step.input })}
                </p>
                <p className="mb-3 text-xs text-soft">
                  {t("contribution", {
                    grams: Math.round(step.grams),
                    extra:
                      step.kind === "fuzzy" && step.kcalContribution != null
                        ? t("contributionKcal", { kcal: Math.round(step.kcalContribution) })
                        : "",
                  })}
                </p>

                {/* Честная пометка: в базе USDA точного совпадения нет — это ближайшее. */}
                {step.kind === "fuzzy" && (
                  <p className="mb-4 border-l-2 border-ochre pl-3 text-xs leading-relaxed text-soft">
                    {t("noExactMatch")}
                  </p>
                )}

                <div className="flex flex-col gap-2">
                  {step.kind === "fuzzy" && (
                    <OptionButton
                      primary
                      disabled={busy}
                      onClick={() => decide({ type: "canonical", id: step.matchedId })}
                    >
                      {t("countAs", { name: step.matchedName })}
                    </OptionButton>
                  )}

                  {step.kind === "unmatched" &&
                    step.suggestions[0] &&
                    step.suggestions[0].similarity >= 0.3 && (
                      <OptionButton
                        primary
                        disabled={busy}
                        onClick={() =>
                          decide({ type: "canonical", id: step.suggestions[0].ingredient_id })
                        }
                      >
                        {t("countAs", { name: step.suggestions[0].name_ru })}
                      </OptionButton>
                    )}

                  {step.kind === "unmatched" && step.estimate && (
                    <OptionButton
                      disabled={busy}
                      onClick={() => decide({ type: "ai_estimate", macros: step.estimate! })}
                    >
                      {t("useAiEstimate", { kcal: Math.round(step.estimate.kcal_100g) })}
                    </OptionButton>
                  )}

                  <OptionButton disabled={busy} onClick={() => setPickingOther(true)}>
                    {t("chooseOther")}
                  </OptionButton>

                  <OptionButton disabled={busy} onClick={() => decide({ type: "skip" })}>
                    {t("skip")}
                  </OptionButton>
                </div>

                {/* Запросить добавление (для не найденных) */}
                {step.kind === "unmatched" && (
                  <div className="mt-3">
                    {requested.has(step.aliasText) ? (
                      <span className="text-xs text-olive">{t("requestSent")}</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => sendRequest(step)}
                        disabled={busy}
                        className="text-xs text-muted underline-offset-2 transition-colors hover:text-soft hover:underline disabled:opacity-40"
                      >
                        {t("requestAdd")}
                      </button>
                    )}
                  </div>
                )}

                {/* Выбрать за меня */}
                <div className="mt-5 border-t border-rule pt-4">
                  <button
                    type="button"
                    onClick={autoCurrent}
                    disabled={busy}
                    className="font-body text-xs uppercase tracking-[0.13em] text-ochre-dk transition-colors hover:text-burg disabled:opacity-40"
                  >
                    {busy ? <Spinner size="sm" className="mr-1 inline-block" /> : "→ "}
                    {t("decideForMe")}
                  </button>
                </div>
              </>
            )
          ) : null}

          {error && <p className="mt-4 text-xs text-burg bg-burg/5 px-3 py-2">{error}</p>}
        </div>
      </div>
    </div>
  );
}

function OptionButton({
  children,
  onClick,
  disabled,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-full rounded-none border px-4 py-2.5 text-left text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        primary
          ? "border-burg bg-burg text-paper hover:bg-burg-dk"
          : "border-rule bg-paper text-ink hover:border-burg hover:text-burg",
      )}
    >
      {children}
    </button>
  );
}

// ── Поиск по всей базе (внутри модалки) ─────────────────────────────────────

interface PickerRow {
  id: string;
  name_ru: string;
  category: string | null;
  kcal_100g: number;
}

function SearchPicker({
  target,
  onPick,
  onBack,
  busy,
}: {
  target: Step;
  onPick: (id: string) => void;
  onBack: () => void;
  busy: boolean;
}) {
  const t = useTranslations("recipe.resolve");
  // Пусто по умолчанию — показываем ВЕСЬ справочник (по алфавиту, скроллом),
  // пользователь фильтрует по подстроке. Триграм-«угадайку» для ручного выбора
  // не используем — она давала мусор (короткий ввод → круассан/лук к «креветк»).
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const supabase = createClient();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const id = window.setTimeout(async () => {
      setLoading(true);
      try {
        // search пустой → вся таблица; иначе — ILIKE-подстрока (ё→е) на сервере.
        const { data, error } = await supabase.rpc("search_ingredients", {
          search: query.trim(),
        });
        if (error) {
          console.warn("[resolve-picker]", error.message);
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
    <div>
      <p className="mb-3 font-display text-[18px] leading-snug text-burg">
        {t("searchTitle", { name: target.input })}
      </p>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("searchPlaceholder")}
        className="mb-2 w-full rounded-none border border-rule bg-crust px-4 py-2.5 text-sm text-ink outline-none transition focus:ring-2 focus:ring-burg/30"
      />
      {!loading && (
        <p className="mb-2 text-[11px] text-muted">
          {query.trim() ? t("searchCount", { count: results.length }) : t("searchAll", { count: results.length })}
        </p>
      )}
      <div className="max-h-64 overflow-y-auto border border-rule">
        {loading ? (
          <div className="flex items-center gap-2 p-4 text-xs text-soft">
            <Spinner size="sm" /> …
          </div>
        ) : results.length === 0 ? (
          <p className="p-4 text-xs text-soft">{t("noResults")}</p>
        ) : (
          <ul>
            {results.map((r) => (
              <li key={r.id} className="border-b border-rule last:border-b-0 hover:bg-crust/60">
                <button
                  type="button"
                  onClick={() => onPick(r.id)}
                  disabled={busy}
                  className="w-full px-3 py-2.5 text-left disabled:opacity-50"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm text-ink">{r.name_ru}</span>
                    <span className="shrink-0 text-xs text-soft">
                      {Math.round(r.kcal_100g)} {t("kcalUnit")}
                    </span>
                  </div>
                  {r.category && (
                    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted">
                      {r.category}
                    </p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="mt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={busy}
          className="rounded-none border border-rule bg-paper px-4 py-2 text-xs text-soft transition-colors hover:text-burg disabled:opacity-40"
        >
          {t("back")}
        </button>
      </div>
    </div>
  );
}

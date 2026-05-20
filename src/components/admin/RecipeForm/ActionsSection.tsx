"use client";

import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui";

interface ActionsSectionProps {
  recipeId?: string;
  published: boolean;
  featured: boolean;
  saving: boolean;
  autoCalcNutrition: boolean;
  translating: boolean;
  translateSuccess: boolean;
  combinedStep: null | "translating" | "generating";
  error: string | null;
  onTogglePublished: () => void;
  onToggleFeatured: () => void;
  onTranslate: () => void;
  onTranslateAndGenerate: () => void;
  onCancel: () => void;
}

function Toggle({
  checked,
  onToggle,
  label,
  activeColor,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  activeColor: "sage" | "peach";
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer self-start">
      <div
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => e.key === "Enter" && onToggle()}
        className={cn(
          "w-11 h-[26px] rounded-full transition-colors duration-200 relative cursor-pointer shrink-0",
          checked
            ? activeColor === "sage" ? "bg-sage" : "bg-peach"
            : "bg-[#d5d0ca]"
        )}
      >
        <span
          className={cn(
            "absolute top-[3px] left-[3px] w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200",
            checked && "translate-x-[18px]"
          )}
        />
      </div>
      <span className="text-sm text-charcoal/60">{label}</span>
    </label>
  );
}

export default function ActionsSection({
  recipeId, published, featured, saving, autoCalcNutrition, translating,
  translateSuccess, combinedStep, error,
  onTogglePublished, onToggleFeatured,
  onTranslate, onTranslateAndGenerate, onCancel,
}: ActionsSectionProps) {
  const isBusy = saving || translating || !!combinedStep;

  return (
    <section className="flex flex-col gap-4 pb-10">
      {error && (
        <p className="text-sm text-red-400 bg-red-50 rounded-xl px-4 py-3">{error}</p>
      )}

      <Toggle
        checked={published}
        onToggle={onTogglePublished}
        label={published ? "Опубликован" : "Черновик"}
        activeColor="sage"
      />
      <Toggle
        checked={featured}
        onToggle={onToggleFeatured}
        label="Самое любимое блюдо"
        activeColor="peach"
      />

      <div className="flex flex-wrap gap-3">
        {/* Primary save */}
        <button
          type="submit"
          disabled={isBusy}
          className="bg-charcoal text-cream px-8 py-3.5 rounded-full text-sm font-medium hover:bg-peach transition-colors disabled:opacity-50"
        >
          {autoCalcNutrition ? "Считаю КБЖУ…" : saving ? "Сохраняем..." : recipeId ? "Сохранить изменения" : "Создать рецепт"}
        </button>

        {/* Translate + generate cover — edit mode only */}
        {recipeId && (
          <button
            type="button"
            onClick={onTranslateAndGenerate}
            disabled={isBusy}
            className={cn(
              "inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-medium transition-all disabled:opacity-50",
              translateSuccess && !combinedStep
                ? "bg-sage text-cream"
                : "bg-peach/10 text-peach hover:bg-peach/20 border border-peach/20"
            )}
          >
            {combinedStep === "translating" ? (
              <><SpinIcon />Переводим…</>
            ) : combinedStep === "generating" ? (
              <><SpinIcon />Генерируем обложку…</>
            ) : translateSuccess ? (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Готово
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                  <path strokeLinecap="round" strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
                  />
                </svg>
                ✦ Перевести и создать обложку
              </>
            )}
          </button>
        )}

        {/* Translate only — secondary */}
        {recipeId && !combinedStep && (
          <button
            type="button"
            onClick={onTranslate}
            disabled={translating || isBusy}
            className="px-4 py-3.5 rounded-full text-sm text-charcoal/40 hover:text-charcoal/70 transition-colors disabled:opacity-50"
          >
            {translating ? "Переводим…" : "Только перевести"}
          </button>
        )}

        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3.5 rounded-full text-sm text-charcoal/50 hover:text-charcoal border border-charcoal/10 hover:border-charcoal/25 transition-colors"
        >
          Отмена
        </button>
      </div>
    </section>
  );
}

function SpinIcon() {
  return <Spinner size="sm" className="text-current" />;
}

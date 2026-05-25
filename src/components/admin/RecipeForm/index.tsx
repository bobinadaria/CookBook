"use client";

import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import { useRecipeForm, type RecipeFormDefaults } from "./useRecipeForm";
import BasicInfoSection from "./BasicInfoSection";
import StepsSection from "./StepsSection";
import CategoriesSection from "./CategoriesSection";
import MediaSection from "./MediaSection";
import NutritionSection from "./NutritionSection";
import ActionsSection from "./ActionsSection";

interface RecipeFormProps {
  /** Present → edit mode; absent → create mode. */
  recipeId?: string;
  defaultValues?: RecipeFormDefaults;
}

export default function RecipeForm({ recipeId, defaultValues }: RecipeFormProps) {
  const form = useRecipeForm(recipeId, defaultValues);
  const isDrink = form.recipeType === "drink";
  // Язык контента берём из переключателя в шапке (RU/EN, cookie NEXT_LOCALE),
  // отдельного тумблера в форме больше нет.
  const locale = useLocale();
  const isEn = locale === "en";
  // Предупреждение о несохранённом рецепте при уходе со страницы.
  const guard = useUnsavedChangesGuard(form.isDirty);

  return (
    <>
    <form onSubmit={form.handleSubmit} className="flex flex-col gap-8">
      {/* Верхний блок: тип + квадратная обложка слева, основные поля справа —
          компактнее, без длинного скролла (как в пользовательской форме). */}
      <div className="grid gap-8 md:grid-cols-[300px_1fr] md:items-start">
        {/* Левая колонка: тип рецепта + обложка */}
        <div className="flex flex-col gap-6">
          <section>
            <label className="block text-xs text-soft uppercase tracking-wider mb-2">
              Тип рецепта
            </label>
            <div className="inline-flex gap-2">
              {(["food", "drink"] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => form.setRecipeType(type)}
                  className={cn(
                    "rounded-none border px-5 py-2.5 text-sm transition-colors",
                    form.recipeType === type
                      ? "border-burg bg-burg text-paper"
                      : "border-rule bg-crust text-soft hover:text-burg",
                  )}
                >
                  {type === "food" ? "Еда" : "Напиток"}
                </button>
              ))}
            </div>
            {isDrink && (
              <p className="mt-2 text-xs text-muted">
                У напитков нет КБЖУ, времени приготовления и порций — только состав и шаги.
              </p>
            )}
          </section>

          <MediaSection
            coverPreview={form.coverPreview}
            generatingCover={form.generatingCover}
            generateError={form.generateError}
            combinedStep={form.combinedStep}
            inputRef={form.coverInputRef}
            onFileChange={form.handleCoverChange}
            onGenerate={form.handleGenerateCover}
          />
        </div>

        {/* Правая колонка: подсказка EN + основные поля */}
        <div className="flex flex-col gap-5">
          {isEn && (
            <p className="text-xs text-muted">
              Редактируешь английскую версию (язык выбран в шапке справа). Адрес страницы,
              время, порции, категории, КБЖУ и обложка — общие для обоих языков. Кнопка
              «Перевести» внизу заполнит эти поля автоматически.
            </p>
          )}

          <BasicInfoSection
            title={isEn ? form.titleEn : form.title}
            slug={form.slug}
            note={isEn ? form.noteEn : form.note}
            cookTime={form.cookTime}
            servings={form.servings}
            isDrink={isDrink}
            onTitleChange={isEn ? form.setTitleEn : form.setTitle}
            onSlugChange={form.setSlug}
            onSlugEdit={() => form.setSlugEdited(true)}
            onNoteChange={isEn ? form.setNoteEn : form.setNote}
            onCookTimeChange={form.setCookTime}
            onServingsChange={form.setServings}
          />
        </div>
      </div>

      {/* Ingredients */}
      <section>
        <label className="block text-xs text-soft uppercase tracking-wider mb-2">
          Состав / Ингредиенты
        </label>
        <textarea
          rows={6}
          value={isEn ? form.ingredientsEn : form.ingredients}
          onChange={(e) => (isEn ? form.setIngredientsEn : form.setIngredients)(e.target.value)}
          placeholder={
            isDrink
              ? "Тоник — 200 мл\nЭспрессо — 60 мл\nЛёд — 4-5 кубиков\nАпельсин — 1 долька"
              : "Персик\nКамамбер\nТимьян\nКруассаны\nМёд\nГрецкий орех"
          }
          className="w-full bg-crust rounded-none px-4 py-3 text-sm text-ink resize-none placeholder:text-muted outline-none focus:ring-2 focus:ring-burg/30 transition"
        />
        <p className="mt-1 text-xs text-muted">
          {isDrink
            ? "По одному ингредиенту на строку, можно с количеством"
            : "По одному ингредиенту на строку"}
        </p>
      </section>

      {!isDrink && (
        <NutritionSection
          current={form.currentNutrition}
          fresh={form.freshNutrition}
          recipeId={recipeId}
          ingredientsEmpty={form.ingredients.trim().length === 0}
          ingredientsDirty={form.ingredientsDirty}
          calculating={form.calculatingNutrition}
          error={form.nutritionError}
          onCalculate={form.handleCalculateNutrition}
        />
      )}

      <CategoriesSection
        allCategories={form.allCategories}
        selectedIds={form.selectedCategoryIds}
        onToggle={form.toggleCategory}
        isDrink={isDrink}
      />

      <StepsSection
        steps={form.steps}
        lang={isEn ? "en" : "ru"}
        onAdd={form.addStep}
        onUpdate={form.updateStep}
        onRemove={form.removeStep}
        onMove={form.moveStep}
      />

      <ActionsSection
        recipeId={recipeId}
        published={form.published}
        featured={form.featured}
        saving={form.saving}
        autoCalcNutrition={form.autoCalcNutrition}
        translating={form.translating}
        translateSuccess={form.translateSuccess}
        combinedStep={form.combinedStep}
        error={form.error}
        onTogglePublished={() => form.setPublished((p) => !p)}
        onToggleFeatured={() => form.setFeatured((f) => !f)}
        onTranslate={form.handleTranslate}
        onTranslateAndGenerate={form.handleTranslateAndGenerate}
        onCancel={guard.guardedBack}
      />
    </form>

    {guard.promptOpen && (
      <ConfirmDialog
        title="Несохранённые изменения"
        message="Рецепт ещё не сохранён. Если уйти сейчас, изменения могут потеряться."
        confirmLabel="Уйти без сохранения"
        cancelLabel="Остаться"
        onConfirm={guard.confirmLeave}
        onCancel={guard.cancelLeave}
      />
    )}
    </>
  );
}

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
import UnmatchedIngredients from "@/components/recipe/UnmatchedIngredients";

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
      {/* Импорт по ссылке — только при создании нового рецепта. Подтягивает
          title/description/ingredients/steps/cook_time/servings/recipe_type из
          страницы (JSON-LD без AI или фолбэк через gpt-4o-mini). Обложка и фото
          шагов не импортируются. После импорта поля можно сразу править. */}
      {!recipeId && (
        <section className="bg-crust border border-rule rounded-none p-5">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div>
              <label
                htmlFor="admin-import-url"
                className="block text-xs text-soft uppercase tracking-wider"
              >
                Импорт по ссылке
              </label>
              <p className="mt-1 text-xs text-muted">
                Вставь URL страницы с рецептом — заполним название, состав, шаги
                и время. Обложку и фото шагов всё равно нужно добавить вручную.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              id="admin-import-url"
              type="url"
              inputMode="url"
              autoComplete="off"
              spellCheck={false}
              value={form.importUrl}
              onChange={(e) => form.setImportUrl(e.target.value)}
              placeholder="https://example.com/recipe"
              className="flex-1 bg-paper border border-rule rounded-none px-4 py-2.5 text-sm text-ink placeholder:text-muted outline-none focus:ring-2 focus:ring-burg/30 transition"
              disabled={form.importing}
              onKeyDown={(e) => {
                // Enter в поле URL — импортируем, не сабмитим всю форму.
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (!form.importing && form.importUrl.trim()) {
                    form.handleImportFromUrl();
                  }
                }
              }}
            />
            <button
              type="button"
              onClick={form.handleImportFromUrl}
              disabled={form.importing || !form.importUrl.trim()}
              className={cn(
                "rounded-none border px-5 py-2.5 text-sm transition-colors",
                form.importing || !form.importUrl.trim()
                  ? "border-rule bg-crust text-muted cursor-not-allowed"
                  : "border-burg bg-burg text-paper hover:bg-burg-dk",
              )}
            >
              {form.importing ? "Импортирую…" : "Заполнить из ссылки"}
            </button>
          </div>
          {form.importError && (
            <p className="mt-3 text-xs text-burg">{form.importError}</p>
          )}
          {form.importNotice && !form.importError && (
            <p className="mt-3 text-xs text-olive">{form.importNotice}</p>
          )}
        </section>
      )}

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
              время, порции, категории, КБЖУ и обложка — общие для обоих языков. Английский
              перевод создаётся автоматически при сохранении; здесь его можно поправить вручную.
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
        <>
          <NutritionSection
            current={form.currentNutrition}
            fresh={form.freshNutrition}
            ingredientsEmpty={form.ingredients.trim().length === 0}
            calculating={form.calculatingNutrition}
            error={form.nutritionError}
            onCalculate={form.handleCalculateNutrition}
          />
          {(() => {
            const n = form.freshNutrition ?? form.currentNutrition;
            if (!n?.unmatched || n.unmatched.length === 0) return null;
            return (
              <UnmatchedIngredients
                unmatched={n.unmatched}
                ingredientsText={form.ingredients}
                servings={form.servings}
                onResolved={(nutrition) => form.setFreshNutrition(nutrition)}
              />
            );
          })()}
        </>
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
        error={form.error}
        onTogglePublished={() => form.setPublished((p) => !p)}
        onToggleFeatured={() => form.setFeatured((f) => !f)}
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

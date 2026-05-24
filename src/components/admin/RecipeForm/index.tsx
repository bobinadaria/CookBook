"use client";

import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
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
  const router = useRouter();
  const form = useRecipeForm(recipeId, defaultValues);
  const isDrink = form.recipeType === "drink";
  const isEn = form.formLang === "en";

  return (
    <form onSubmit={form.handleSubmit} className="flex flex-col gap-10">
      {/* ── Recipe type: еда / напиток ─────────────────────────────────── */}
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

      {/* ── Язык контента: RU / EN ─────────────────────────────────────── */}
      <section>
        <label className="block text-xs text-soft uppercase tracking-wider mb-2">
          Язык контента
        </label>
        <div className="inline-flex gap-2">
          {(["ru", "en"] as const).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => form.setFormLang(lang)}
              className={cn(
                "rounded-none border px-5 py-2.5 text-sm uppercase tracking-wider transition-colors",
                form.formLang === lang
                  ? "border-burg bg-burg text-paper"
                  : "border-rule bg-crust text-soft hover:text-burg",
              )}
            >
              {lang === "ru" ? "RU" : "EN"}
            </button>
          ))}
        </div>
        {isEn && (
          <p className="mt-2 text-xs text-muted">
            Редактируешь английскую версию. Адрес страницы, время, порции, категории,
            КБЖУ и обложка — общие для обоих языков. Кнопка «Перевести» внизу заполнит
            эти поля автоматически.
          </p>
        )}
      </section>

      <BasicInfoSection
        title={isEn ? form.titleEn : form.title}
        slug={form.slug}
        description={isEn ? form.descriptionEn : form.description}
        note={isEn ? form.noteEn : form.note}
        cookTime={form.cookTime}
        servings={form.servings}
        isDrink={isDrink}
        onTitleChange={isEn ? form.setTitleEn : form.setTitle}
        onSlugChange={form.setSlug}
        onSlugEdit={() => form.setSlugEdited(true)}
        onDescriptionChange={isEn ? form.setDescriptionEn : form.setDescription}
        onNoteChange={isEn ? form.setNoteEn : form.setNote}
        onCookTimeChange={form.setCookTime}
        onServingsChange={form.setServings}
      />

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
        lang={form.formLang}
        onAdd={form.addStep}
        onUpdate={form.updateStep}
        onRemove={form.removeStep}
        onMove={form.moveStep}
      />

      <MediaSection
        coverPreview={form.coverPreview}
        recipeId={recipeId}
        generatingCover={form.generatingCover}
        generateError={form.generateError}
        combinedStep={form.combinedStep}
        inputRef={form.coverInputRef}
        onFileChange={form.handleCoverChange}
        onGenerate={form.handleGenerateCover}
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
        onCancel={() => router.back()}
      />
    </form>
  );
}

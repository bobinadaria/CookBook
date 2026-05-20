"use client";

import { useRouter } from "next/navigation";
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

  return (
    <form onSubmit={form.handleSubmit} className="flex flex-col gap-10">
      <BasicInfoSection
        title={form.title}
        slug={form.slug}
        description={form.description}
        note={form.note}
        cookTime={form.cookTime}
        servings={form.servings}
        onTitleChange={form.setTitle}
        onSlugChange={form.setSlug}
        onSlugEdit={() => form.setSlugEdited(true)}
        onDescriptionChange={form.setDescription}
        onNoteChange={form.setNote}
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
          value={form.ingredients}
          onChange={(e) => form.setIngredients(e.target.value)}
          placeholder={"Персик\nКамамбер\nТимьян\nКруассаны\nМёд\nГрецкий орех"}
          className="w-full bg-crust rounded-none px-4 py-3 text-sm text-ink resize-none placeholder:text-muted outline-none focus:ring-2 focus:ring-burg/30 transition"
        />
        <p className="mt-1 text-xs text-muted">По одному ингредиенту на строку</p>
      </section>

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

      <CategoriesSection
        allCategories={form.allCategories}
        selectedIds={form.selectedCategoryIds}
        onToggle={form.toggleCategory}
      />

      <StepsSection
        steps={form.steps}
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

"use client";

/**
 * Bilingual (RU/EN) recipe form for the user's private "My cookbook".
 *
 * A lighter sibling of the admin RecipeForm: no publish/featured toggles and no
 * AI controls (translate / cover generation / KБЖУ). Cover and step photos are
 * uploaded via the auth-only /api/upload route, then the resulting URLs are sent
 * to the createUserRecipe / updateUserRecipe server actions (which force
 * owner_id / visibility='private' / published=false and enforce the plan limit).
 *
 * Защита от потери данных: пока в форме есть несохранённые правки, уход со
 * страницы (ссылки, «Отмена», закрытие вкладки) спрашивает подтверждение
 * (useUnsavedChangesGuard + ConfirmDialog).
 */

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { EditorialButton, ConfirmDialog } from "@/components/ui";
import { cn } from "@/lib/utils";
import { localizedField } from "@/lib/localized-content";
import { categoryTypesForRecipe } from "@/lib/category-types";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import type { Category, LocaleCode, NutritionData } from "@/types";
import { createUserRecipe, updateUserRecipe } from "@/app/dashboard/recipes/actions";
import type { UserRecipeResult } from "@/app/dashboard/recipes/types";
import type { ImportedRecipe, ImportSource } from "@/lib/recipe-import/types";

interface StepState {
  id?: string;
  order: number;
  title: string;
  description: string;
  photo_url: string | null;
  /** Locally selected file, uploaded on submit. */
  photoFile?: File;
}

export interface UserRecipeFormDefaults {
  title?: string;
  description?: string;
  note?: string;
  ingredients?: string;
  recipe_type?: "food" | "drink";
  cook_time?: number | null;
  servings?: number | null;
  cover_image?: string | null;
  categoryIds?: string[];
  steps?: StepState[];
  nutrition?: NutritionData | null;
}

interface UserRecipeFormProps {
  categories: Category[];
  recipeId?: string;
  defaultValues?: UserRecipeFormDefaults;
  /** Доступ к AI-функциям (расчёт КБЖУ) — premium/lifetime. Управляет показом кнопки. */
  aiEnabled?: boolean;
}

async function uploadImage(bucket: string, file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("bucket", bucket);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || "Upload failed");
  return json.url as string;
}

const inputClass =
  "w-full bg-crust rounded-none px-4 py-3 text-sm text-ink placeholder:text-muted outline-none focus:ring-2 focus:ring-burg/30 transition";

export default function UserRecipeForm({
  categories,
  recipeId,
  defaultValues,
  aiEnabled = false,
}: UserRecipeFormProps) {
  const t = useTranslations("myRecipes");
  const tn = useTranslations("recipe.nutrition");
  const locale = useLocale() as LocaleCode;
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [note, setNote] = useState(defaultValues?.note ?? "");
  const [ingredients, setIngredients] = useState(defaultValues?.ingredients ?? "");
  const [cookTime, setCookTime] = useState<number | null>(defaultValues?.cook_time ?? null);
  const [servings, setServings] = useState<number | null>(defaultValues?.servings ?? null);

  const [recipeType, setRecipeType] = useState<"food" | "drink">(
    defaultValues?.recipe_type ?? "food",
  );
  const isDrink = recipeType === "drink";
  // При выборе «напиток» обнуляем время и порции (КБЖУ скрывается и не
  // сохраняется для напитков — см. payload и секцию КБЖУ ниже).
  const changeRecipeType = (type: "food" | "drink") => {
    setRecipeType(type);
    if (type === "drink") {
      setCookTime(null);
      setServings(null);
    }
  };

  const [coverFile, setCoverFile] = useState<File | undefined>();
  const [coverPreview, setCoverPreview] = useState<string | null>(
    defaultValues?.cover_image ?? null,
  );

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(
    new Set(defaultValues?.categoryIds ?? []),
  );

  const [steps, setSteps] = useState<StepState[]>(defaultValues?.steps ?? []);

  const [nutrition, setNutrition] = useState<NutritionData | null>(
    defaultValues?.nutrition ?? null,
  );
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Импорт по ссылке (premium) ────────────────────────────────────────────
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  /** Машиночитаемый код ошибки импорта → локализованное сообщение. */
  const importErrorMessage = (code?: string): string => {
    switch (code) {
      case "timeout":
        return t("importErrTimeout");
      case "unreachable":
        return t("importErrUnreachable");
      case "not_recipe":
        return t("importErrNotRecipe");
      default:
        return t("importErrGeneric");
    }
  };

  const handleImport = async () => {
    const url = importUrl.trim();
    if (!url || importing) return;
    setImporting(true);
    setImportError(null);
    setImportNotice(null);
    try {
      const res = await fetch("/api/recipes/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        recipe?: ImportedRecipe;
        source?: ImportSource;
        code?: string;
      };
      if (!res.ok || !json.recipe) {
        setImportError(importErrorMessage(json.code));
        return;
      }

      const r = json.recipe;
      // Тип ставим первым: для «напитка» обнуляются время/порции, поэтому их
      // выставляем только для еды.
      changeRecipeType(r.recipe_type === "drink" ? "drink" : "food");
      if (r.title) setTitle(r.title);
      setDescription(r.description ?? "");
      setIngredients((r.ingredients ?? []).join("\n"));
      setSteps(
        (r.steps ?? []).map((s, i) => ({
          order: i + 1,
          title: s.title ?? "",
          description: s.description ?? "",
          photo_url: null,
        })),
      );
      if (r.recipe_type !== "drink") {
        setCookTime(typeof r.cook_time === "number" ? r.cook_time : null);
        setServings(typeof r.servings === "number" ? r.servings : null);
      }
      // КБЖУ пересчитывается по новому составу — старое значение не тащим.
      setNutrition(null);
      setImportNotice(
        json.source === "structured" ? t("importDoneStructured") : t("importDoneAi"),
      );
    } catch {
      setImportError(t("importErrGeneric"));
    } finally {
      setImporting(false);
    }
  };

  // ── Несохранённые изменения ───────────────────────────────────────────────
  // Снимок текущих полей; сравниваем с исходным снимком (снят при первом рендере).
  const currentSnapshot = useMemo(
    () =>
      JSON.stringify({
        title,
        description,
        note,
        ingredients,
        recipeType,
        cookTime,
        servings,
        cover: coverPreview,
        coverFile: coverFile ? `${coverFile.name}:${coverFile.size}` : null,
        categories: Array.from(selectedCategoryIds).sort(),
        steps: steps.map((s) => ({
          title: s.title,
          description: s.description,
          photo: s.photo_url,
          photoFile: s.photoFile ? `${s.photoFile.name}:${s.photoFile.size}` : null,
        })),
        nutrition,
      }),
    [
      title,
      description,
      note,
      ingredients,
      recipeType,
      cookTime,
      servings,
      coverPreview,
      coverFile,
      selectedCategoryIds,
      steps,
      nutrition,
    ],
  );
  const initialSnapshotRef = useRef<string | null>(null);
  if (initialSnapshotRef.current === null) initialSnapshotRef.current = currentSnapshot;
  // Есть ли в форме осмысленное содержимое (включая название, подставленное из
  // модалки создания). Для нового рецепта именно это считаем «несохранённым».
  const hasContent =
    title.trim() !== "" ||
    description.trim() !== "" ||
    note.trim() !== "" ||
    ingredients.trim() !== "" ||
    !!coverFile ||
    coverPreview !== null ||
    selectedCategoryIds.size > 0 ||
    steps.length > 0 ||
    cookTime !== null ||
    servings !== null ||
    nutrition !== null;
  // Во время сохранения не считаем форму «грязной», чтобы не мешать редиректу.
  // Создание: «грязно», если есть содержимое. Редактирование: если что-то изменилось.
  const isDirty =
    !saving && (recipeId ? currentSnapshot !== initialSnapshotRef.current : hasContent);
  const { promptOpen, guardedBack, confirmLeave, cancelLeave } = useUnsavedChangesGuard(isDirty);

  // Group categories by type. Напиток видит «Тип напитка» и не видит «Тип блюда»
  // (и наоборот) — та же логика, что в админ-форме.
  const groupedCategories = useMemo(() => {
    const grouped = categories.reduce<Record<string, Category[]>>((acc, cat) => {
      (acc[cat.type] ??= []).push(cat);
      return acc;
    }, {});
    return categoryTypesForRecipe(isDrink)
      .filter((type) => grouped[type]?.length)
      .map((type) => [type, grouped[type]] as const);
  }, [categories, isDrink]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addStep = () =>
    setSteps((prev) => [
      ...prev,
      { order: prev.length + 1, title: "", description: "", photo_url: null },
    ]);

  const updateStep = (index: number, patch: Partial<StepState>) =>
    setSteps((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const removeStep = (index: number) =>
    setSteps((prev) =>
      prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })),
    );

  const moveStep = (index: number, dir: -1 | 1) =>
    setSteps((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((s, i) => ({ ...s, order: i + 1 }));
    });

  const handleStepPhoto = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    updateStep(index, { photoFile: file, photo_url: URL.createObjectURL(file) });
  };

  const handleCalcNutrition = async () => {
    if (!ingredients.trim() || calcLoading) return;
    setCalcLoading(true);
    setCalcError(null);
    try {
      const res = await fetch("/api/recipes/calculate-nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients, servings }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCalcError(json.error || t("nutritionError"));
        return;
      }
      setNutrition(json.nutrition as NutritionData);
    } catch {
      setCalcError(t("nutritionError"));
    } finally {
      setCalcLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(t("errTitle"));
      return;
    }
    if (steps.some((s) => !s.description.trim())) {
      setError(t("errStep"));
      return;
    }

    setSaving(true);
    setError(null);

    try {
      // Upload cover if a new file was picked; otherwise keep the existing URL.
      let coverUrl = coverPreview;
      if (coverFile) coverUrl = await uploadImage("recipe-covers", coverFile);

      // Upload any new step photos, resolve to plain URLs.
      const resolvedSteps = await Promise.all(
        steps.map(async (s) => {
          let photo_url = s.photoFile ? null : s.photo_url;
          if (s.photoFile) photo_url = await uploadImage("step-photos", s.photoFile);
          return {
            id: s.id,
            order: s.order,
            title: s.title,
            description: s.description,
            photo_url,
          };
        }),
      );

      const payload = {
        title,
        description,
        note,
        ingredients,
        recipe_type: recipeType,
        cook_time: isDrink ? null : cookTime,
        servings: isDrink ? null : servings,
        categoryIds: Array.from(selectedCategoryIds),
        cover_image: coverUrl,
        steps: resolvedSteps,
        nutrition: isDrink ? null : nutrition,
      };

      const result: UserRecipeResult = recipeId
        ? await updateUserRecipe(recipeId, payload)
        : await createUserRecipe(payload);

      if (!result.ok) {
        if (result.code === "limit") {
          const limit = result.error.split(":")[1] || "";
          setError(t("errLimit", { limit }));
        } else {
          setError(t("errGeneric"));
        }
        setSaving(false);
        return;
      }

      router.push(`/dashboard/recipes/${result.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errGeneric"));
      setSaving(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Импорт по ссылке — premium-фича, только при создании нового рецепта.
            Бесплатный путь (микроразметка страницы) токены не тратит; фолбэк
            через AI — тратит. Обложку/фото шагов не переносим (next/image +
            копирайт), о чём явно предупреждаем в подсказке. */}
        {aiEnabled && !recipeId && (
          <section className="border border-ochre-dk/40 bg-crust/40 p-5">
            <p className="mb-1 text-xs uppercase tracking-wider text-soft">{t("importTitle")}</p>
            <p className="mb-4 text-xs text-muted">{t("importHint")}</p>
            <div className="flex flex-wrap items-center gap-3">
              <input
                type="url"
                inputMode="url"
                value={importUrl}
                onChange={(e) => setImportUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleImport();
                  }
                }}
                placeholder={t("importPlaceholder")}
                className={cn(inputClass, "flex-1 min-w-[220px]")}
              />
              <EditorialButton
                type="button"
                variant="ghost"
                onClick={handleImport}
                disabled={importing || !importUrl.trim()}
                className="px-6 py-3"
              >
                {importing ? t("importLoading") : t("importButton")}
              </EditorialButton>
            </div>
            {importNotice && <p className="mt-3 text-sm text-olive">{importNotice}</p>}
            {importError && <p className="mt-3 text-sm text-red-500">{importError}</p>}
          </section>
        )}

        {/* Тип рецепта: еда / напиток (обычно уже выбран в модалке создания). */}
        <section>
          <label className="mb-2 block text-xs uppercase tracking-wider text-soft">
            {t("modalTypeLabel")}
          </label>
          <div className="inline-flex gap-2">
            {(["food", "drink"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => changeRecipeType(type)}
                className={cn(
                  "rounded-none border px-4 py-2 text-xs font-medium uppercase tracking-wider transition-colors",
                  recipeType === type
                    ? "border-burg bg-burg text-paper"
                    : "border-rule bg-transparent text-soft hover:border-burg hover:text-burg",
                )}
              >
                {type === "food" ? t("typeFood") : t("typeDrink")}
              </button>
            ))}
          </div>
          {isDrink && <p className="mt-2 text-xs text-muted">{t("drinkNoNutrition")}</p>}
        </section>

        {/* Верхний блок: квадратная обложка слева + основные поля справа.
            Компактнее, чем вертикальная простыня на всю ширину. */}
        <div className="grid gap-6 md:grid-cols-[220px_1fr] md:items-start">
          {/* Cover (square) */}
          <section>
            <label className="mb-2 block text-xs uppercase tracking-wider text-soft">
              {t("fieldCover")}
            </label>
            <div
              role="button"
              tabIndex={0}
              aria-label={t("coverUpload")}
              onClick={() => coverInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  coverInputRef.current?.click();
                }
              }}
              className={cn(
                "relative aspect-square w-full max-w-[220px] cursor-pointer overflow-hidden rounded-none border-2 border-dashed border-rule transition-colors hover:border-ochre-dk focus:outline-none focus:ring-2 focus:ring-burg/30",
                coverPreview ? "border-0" : "flex items-center justify-center bg-crust",
              )}
            >
              {coverPreview ? (
                <Image src={coverPreview} alt="" fill sizes="220px" className="object-cover" />
              ) : (
                <span className="pointer-events-none px-3 text-center text-sm text-muted">
                  {t("coverUpload")}
                </span>
              )}
              {coverPreview && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors hover:bg-black/20">
                  <span className="text-sm font-medium text-white opacity-0 hover:opacity-100">
                    {t("coverReplace")}
                  </span>
                </div>
              )}
            </div>
            <input
              ref={coverInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverChange}
            />
          </section>

          {/* Правая колонка: название, описание, время/порции */}
          <div className="flex flex-col gap-4">
            <section>
              <label className="mb-2 block text-xs uppercase tracking-wider text-soft">
                {t("fieldTitle")} *
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("fieldTitlePlaceholder")}
                required
                className={inputClass}
              />
            </section>

            {!isDrink && (
              <section className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-wider text-soft">
                    {t("fieldCookTime")}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={cookTime ?? ""}
                    onChange={(e) =>
                      setCookTime(e.target.value === "" ? null : Number(e.target.value))
                    }
                    placeholder="45"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-wider text-soft">
                    {t("fieldServings")}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={servings ?? ""}
                    onChange={(e) =>
                      setServings(e.target.value === "" ? null : Number(e.target.value))
                    }
                    placeholder="4"
                    className={inputClass}
                  />
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Note / story */}
        <section>
          <label className="mb-2 block text-xs uppercase tracking-wider text-soft">
            {t("fieldNote")}
          </label>
          <textarea
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("fieldNotePlaceholder")}
            className={cn(inputClass, "resize-none")}
          />
        </section>

        {/* Ingredients */}
        <section>
          <label className="mb-2 block text-xs uppercase tracking-wider text-soft">
            {t("fieldIngredients")}
          </label>
          <textarea
            rows={5}
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder={t("ingredientsPlaceholder")}
            className={cn(inputClass, "resize-none")}
          />
          <p className="mt-1 text-xs text-muted">{t("ingredientsHint")}</p>
        </section>

        {/* КБЖУ через AI — только для аккаунтов с доступом к AI (premium) и только
            для еды (у напитков КБЖУ нет). Кнопка неактивна, пока не заполнен состав. */}
        {aiEnabled && !isDrink && (
          <section className="border border-rule bg-crust/40 p-5">
            <p className="mb-1 text-xs uppercase tracking-wider text-soft">{t("nutritionTitle")}</p>
            <p className="mb-4 text-xs text-muted">{t("nutritionHint")}</p>
            <div className="flex flex-wrap items-center gap-3">
              <EditorialButton
                type="button"
                variant="ghost"
                onClick={handleCalcNutrition}
                disabled={calcLoading || !ingredients.trim()}
                className="px-6 py-3"
              >
                {calcLoading
                  ? t("nutritionCalculating")
                  : nutrition
                    ? t("nutritionRecalc")
                    : t("nutritionCalc")}
              </EditorialButton>
              {!ingredients.trim() && (
                <span className="text-xs text-muted">{t("nutritionNeedIngredients")}</span>
              )}
              {calcError && <span className="text-sm text-red-500">{calcError}</span>}
            </div>
            {nutrition?.per_serving && (
              <div className="mt-4 border-t border-rule pt-4">
                <p>
                  <span className="font-display text-3xl leading-none text-burg">
                    {nutrition.per_serving.kcal}
                  </span>{" "}
                  <span className="text-xs uppercase tracking-wider text-soft">
                    {tn("kcal")} · {t("nutritionPerServing")}
                  </span>
                </p>
                <p className="mt-2 text-xs text-soft">
                  {tn("protein")} {nutrition.per_serving.protein} {tn("gram")} · {tn("fat")}{" "}
                  {nutrition.per_serving.fat} {tn("gram")} · {tn("carbs")}{" "}
                  {nutrition.per_serving.carbs} {tn("gram")}
                </p>
              </div>
            )}
          </section>
        )}

        {/* Categories */}
        {groupedCategories.length > 0 && (
          <section>
            <label className="mb-4 block text-xs uppercase tracking-wider text-soft">
              {t("fieldCategories")}
            </label>
            <div className="flex flex-col gap-5">
              {groupedCategories.map(([type, cats]) => (
                <div key={type}>
                  <p className="mb-2 text-xs text-soft">{t(`catType.${type}`)}</p>
                  <div className="flex flex-wrap gap-2">
                    {cats.map((cat) => {
                      const active = selectedCategoryIds.has(cat.id);
                      const name = localizedField(cat, "name", locale) ?? cat.name;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => toggleCategory(cat.id)}
                          className={cn(
                            "rounded-none border px-3 py-1.5 text-xs font-medium transition-all",
                            active
                              ? "border-burg bg-burg text-paper"
                              : "border-rule bg-transparent text-soft hover:border-burg hover:text-burg",
                          )}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Steps */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <label className="block text-xs uppercase tracking-wider text-soft">
              {t("fieldSteps")}
            </label>
            <span className="text-xs text-muted">{t("stepsCount", { count: steps.length })}</span>
          </div>

          <div className="mb-4 flex flex-col gap-3">
            {steps.map((step, i) => (
              <div key={step.id ?? i} className="flex gap-4 border border-rule bg-crust/50 p-4">
                <div className="flex shrink-0 flex-col items-center gap-1 pt-1">
                  <span className="w-7 text-center font-display text-2xl leading-none text-muted">
                    {i + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => moveStep(i, -1)}
                    disabled={i === 0}
                    className="px-1 text-muted transition-colors hover:text-burg disabled:opacity-20"
                    aria-label="up"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveStep(i, 1)}
                    disabled={i === steps.length - 1}
                    className="px-1 text-muted transition-colors hover:text-burg disabled:opacity-20"
                    aria-label="down"
                  >
                    ↓
                  </button>
                </div>

                <div className="flex flex-1 flex-col gap-3">
                  <input
                    placeholder={t("stepTitlePlaceholder")}
                    value={step.title}
                    onChange={(e) => updateStep(i, { title: e.target.value })}
                    className={inputClass}
                  />
                  <textarea
                    placeholder={`${t("stepDescPlaceholder")} *`}
                    value={step.description}
                    rows={2}
                    onChange={(e) => updateStep(i, { description: e.target.value })}
                    className={cn(inputClass, "resize-none")}
                  />
                  <div className="flex items-center gap-3">
                    {step.photo_url ? (
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden">
                        <Image src={step.photo_url} alt="" fill className="object-cover" />
                        <button
                          type="button"
                          onClick={() => updateStep(i, { photoFile: undefined, photo_url: null })}
                          className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 transition-opacity hover:opacity-100"
                          aria-label="remove photo"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer border border-dashed border-rule px-3 py-2 text-xs text-soft transition-colors hover:border-ochre-dk hover:text-ochre-dk">
                        + {t("stepAddPhoto")}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleStepPhoto(i, e)}
                        />
                      </label>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeStep(i)}
                  className="self-start px-1.5 text-muted transition-colors hover:text-red-400"
                  aria-label="remove step"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addStep}
            className="w-full justify-center rounded-none border border-dashed border-rule px-4 py-3 text-sm text-soft transition-colors hover:border-ochre-dk hover:text-ochre-dk"
          >
            + {t("addStep")}
          </button>
        </section>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 border-t border-rule pt-6">
          <EditorialButton type="submit" disabled={saving} className="px-7 py-3">
            {saving ? t("saving") : t("save")}
          </EditorialButton>
          <EditorialButton
            type="button"
            variant="ghost"
            onClick={guardedBack}
            disabled={saving}
            className="px-6 py-3"
          >
            {t("cancel")}
          </EditorialButton>
          {error && <span className="text-sm text-red-500">{error}</span>}
        </div>
      </form>

      {promptOpen && (
        <ConfirmDialog
          title={t("leaveTitle")}
          message={t("leaveMessage")}
          confirmLabel={t("leaveConfirm")}
          cancelLabel={t("leaveCancel")}
          onConfirm={confirmLeave}
          onCancel={cancelLeave}
        />
      )}
    </>
  );
}

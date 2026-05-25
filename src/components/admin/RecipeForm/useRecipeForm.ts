"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createRecipe,
  updateRecipe,
  fetchCategories,
  toSlug,
} from "@/lib/supabase/recipes";
import type { Category, StepInput, RecipeInput, NutritionData } from "@/types";

const DRAFT_KEY = "cookbook-recipe-draft";

export interface RecipeFormDefaults extends Partial<RecipeInput> {
  cover_image?: string;
  nutrition?: NutritionData | null;
}

export function useRecipeForm(recipeId?: string, defaultValues?: RecipeFormDefaults) {
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement>(null);

  // ── Field state ────────────────────────────────────────────────────────────
  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [slug, setSlug] = useState(defaultValues?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(!!defaultValues?.slug);
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [note, setNote] = useState(defaultValues?.note ?? "");
  const [ingredients, setIngredients] = useState(defaultValues?.ingredients ?? "");
  // Новый рецепт по умолчанию «Опубликован» (defaultValues нет → create mode).
  // В режиме редактирования defaultValues.published всегда задан (true/false),
  // поэтому реальное состояние существующего рецепта сохраняется.
  const [published, setPublished] = useState(defaultValues?.published ?? true);
  const [featured, setFeatured] = useState(defaultValues?.featured ?? false);
  const [cookTime, setCookTime] = useState<number | null>(defaultValues?.cook_time ?? null);
  const [servings, setServings] = useState<number | null>(defaultValues?.servings ?? null);
  const [recipeType, setRecipeType] = useState<"food" | "drink">(
    defaultValues?.recipe_type ?? "food",
  );

  /** Переключение типа. При выборе «напиток» обнуляем поля, которых у напитков нет. */
  const changeRecipeType = (type: "food" | "drink") => {
    setRecipeType(type);
    if (type === "drink") {
      setCookTime(null);
      setServings(null);
    }
  };

  // ── Двуязычные поля (английская версия контента) ───────────────────────────
  // Язык, который сейчас редактируется в форме. Влияет только на текстовый
  // контент рецепта (название/описание/заметка/состав/шаги); slug, время,
  // порции, категории, КБЖУ, обложка — общие.
  const [formLang, setFormLang] = useState<"ru" | "en">("ru");
  const [titleEn, setTitleEn] = useState(defaultValues?.title_en ?? "");
  const [descriptionEn, setDescriptionEn] = useState(defaultValues?.description_en ?? "");
  const [noteEn, setNoteEn] = useState(defaultValues?.note_en ?? "");
  const [ingredientsEn, setIngredientsEn] = useState(defaultValues?.ingredients_en ?? "");

  /** Заполняет английские поля результатом авто-перевода (Gemini). */
  const applyEnTranslations = (en: {
    title?: string | null;
    description?: string | null;
    note?: string | null;
    ingredients?: string | null;
    steps?: { order: number; title?: string | null; description?: string | null }[];
  }) => {
    setTitleEn(en.title ?? "");
    setDescriptionEn(en.description ?? "");
    setNoteEn(en.note ?? "");
    setIngredientsEn(en.ingredients ?? "");
    if (en.steps?.length) {
      setSteps((prev) =>
        prev.map((s) => {
          const match = en.steps!.find((es) => es.order === s.order);
          return match
            ? { ...s, title_en: match.title ?? "", description_en: match.description ?? "" }
            : s;
        }),
      );
    }
  };

  // ── Cover ──────────────────────────────────────────────────────────────────
  const [coverFile, setCoverFile] = useState<File | undefined>();
  const [coverPreview, setCoverPreview] = useState<string | null>(
    defaultValues?.cover_image ?? null
  );

  // ── Categories ─────────────────────────────────────────────────────────────
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(
    new Set(defaultValues?.categoryIds ?? [])
  );

  // ── Steps ──────────────────────────────────────────────────────────────────
  const [steps, setSteps] = useState<StepInput[]>(defaultValues?.steps ?? []);

  // ── Submit state ───────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Translation state ──────────────────────────────────────────────────────
  const [translating, setTranslating] = useState(false);
  const [translateSuccess, setTranslateSuccess] = useState(false);

  // ── AI cover generation state ──────────────────────────────────────────────
  const [generatingCover, setGeneratingCover] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // ── Combined translate + generate state ────────────────────────────────────
  const [combinedStep, setCombinedStep] = useState<null | "translating" | "generating">(null);

  // ── Nutrition (КБЖУ) state ─────────────────────────────────────────────────
  const [currentNutrition] = useState<NutritionData | null>(
    defaultValues?.nutrition ?? null,
  );
  const [freshNutrition, setFreshNutrition] = useState<NutritionData | null>(null);
  const [calculatingNutrition, setCalculatingNutrition] = useState(false);
  const [nutritionError, setNutritionError] = useState<string | null>(null);
  // True во время авто-расчёта КБЖУ при сохранении (для текста кнопки «Сохранить»).
  const [autoCalcNutrition, setAutoCalcNutrition] = useState(false);
  // Сравнение текста ingredients с сохранённым в БД — если изменилось,
  // расчёт по recipeId возьмёт устаревший текст (мы не пересохраняем перед расчётом).
  const initialIngredients = useRef(defaultValues?.ingredients ?? "");
  const ingredientsDirty = ingredients.trim() !== initialIngredients.current.trim();

  // ── Draft restore (new recipes only) ──────────────────────────────────────
  // Если название пришло из быстрого создания (defaultValues.title в режиме
  // создания), не подменяем его старым автосохранённым черновиком — приоритет
  // у того, что пользователь только что ввёл в модалке.
  const draftRestored = useRef(false);
  useEffect(() => {
    if (recipeId || draftRestored.current || defaultValues?.title) return;
    draftRestored.current = true;
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      if (!saved) return;
      const d = JSON.parse(saved);
      if (d.title) setTitle(d.title);
      if (d.slug) { setSlug(d.slug); setSlugEdited(true); }
      if (d.description) setDescription(d.description);
      if (d.note) setNote(d.note);
      if (d.ingredients) setIngredients(d.ingredients);
      if (d.recipe_type) setRecipeType(d.recipe_type);
      if (d.title_en) setTitleEn(d.title_en);
      if (d.description_en) setDescriptionEn(d.description_en);
      if (d.note_en) setNoteEn(d.note_en);
      if (d.ingredients_en) setIngredientsEn(d.ingredients_en);
      if (typeof d.published === "boolean") setPublished(d.published);
      if (d.featured) setFeatured(d.featured);
      if (d.categoryIds) setSelectedCategoryIds(new Set(d.categoryIds));
      if (d.steps?.length)
        setSteps(d.steps.map((s: StepInput) => ({ ...s, photoFile: undefined })));
    } catch { /* ignore corrupt draft */ }
  }, [recipeId, defaultValues?.title]);

  // ── Auto-save draft (new recipes only) ────────────────────────────────────
  useEffect(() => {
    if (recipeId) return;
    const timer = setTimeout(() => {
      const draft = {
        title, slug, description, note, ingredients, published, featured,
        recipe_type: recipeType,
        title_en: titleEn, description_en: descriptionEn, note_en: noteEn, ingredients_en: ingredientsEn,
        cook_time: cookTime, servings,
        categoryIds: Array.from(selectedCategoryIds),
        steps: steps.map(({ id, order, title, description, title_en, description_en, photo_url }) => ({
          id, order, title, description, title_en, description_en, photo_url,
        })),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }, 500);
    return () => clearTimeout(timer);
  }, [title, slug, description, note, ingredients, published, featured, recipeType, titleEn, descriptionEn, noteEn, ingredientsEn, cookTime, servings, selectedCategoryIds, steps, recipeId]);

  // ── Auto-generate slug from title ─────────────────────────────────────────
  useEffect(() => {
    if (!slugEdited) setSlug(toSlug(title));
  }, [title, slugEdited]);

  // ── Load categories ────────────────────────────────────────────────────────
  useEffect(() => {
    fetchCategories().then(setAllCategories).catch(() => {});
  }, []);

  // ── Cover handler ──────────────────────────────────────────────────────────
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  // ── Category toggle ────────────────────────────────────────────────────────
  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); } else { next.add(id); }
      return next;
    });
  };

  // ── Step helpers ───────────────────────────────────────────────────────────
  const addStep = () =>
    setSteps((prev) => [
      ...prev,
      { order: prev.length + 1, title: "", description: "", photo_url: null },
    ]);

  const updateStep = (index: number, updated: StepInput) =>
    setSteps((prev) => prev.map((s, i) => (i === index ? updated : s)));

  const removeStep = (index: number) =>
    setSteps((prev) =>
      prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 }))
    );

  const moveStep = (index: number, dir: -1 | 1) => {
    setSteps((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((s, i) => ({ ...s, order: i + 1 }));
    });
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("Название обязательно"); return; }
    if (!slug.trim())  { setError("Slug обязателен"); return; }
    if (steps.some((s) => !s.description.trim())) {
      setError("Заполните описание для каждого шага");
      return;
    }

    setSaving(true);
    setError(null);

    const input: RecipeInput = {
      title: title.trim(),
      slug: slug.trim(),
      description: description.trim(),
      note: note.trim(),
      ingredients: ingredients.trim(),
      title_en: titleEn.trim(),
      description_en: descriptionEn.trim(),
      note_en: noteEn.trim(),
      ingredients_en: ingredientsEn.trim(),
      published,
      featured,
      recipe_type: recipeType,
      cook_time: cookTime,
      servings,
      categoryIds: Array.from(selectedCategoryIds),
      steps,
      coverFile,
      cover_image: coverPreview && !coverFile ? coverPreview : undefined,
    };

    try {
      let savedId: string | undefined = recipeId;
      if (recipeId) {
        await updateRecipe(recipeId, input);
      } else {
        savedId = await createRecipe(input);
        localStorage.removeItem(DRAFT_KEY);
      }

      // Авто-расчёт КБЖУ: только когда есть смысл — новый рецепт, изменился состав,
      // или КБЖУ ещё ни разу не считали. Если менялся только заголовок/тег — не дёргаем.
      // Кеш на сервере (по хешу состава) подстрахует от лишнего вызова OpenAI.
      // Напитки не считают КБЖУ — пропускаем авто-расчёт целиком.
      const needsNutrition =
        recipeType !== "drink" &&
        !!input.ingredients && !!savedId && (!recipeId || ingredientsDirty || !currentNutrition);
      if (needsNutrition) {
        setAutoCalcNutrition(true);
        try {
          await fetch("/api/admin/calculate-nutrition", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recipeId: savedId }), // без force → уважает кеш
          });
        } catch {
          // Расчёт не критичен для сохранения: рецепт уже сохранён, КБЖУ можно
          // пересчитать кнопкой позже. Не блокируем редирект.
        }
      }

      // Сбросить ISR-кеш страницы рецепта и главной, чтобы правки появились
      // сразу, а не в течение часа. Не критично — на ошибке просто молчим.
      try {
        await fetch("/api/admin/revalidate-recipe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slug: input.slug }),
        });
      } catch {
        /* кеш сам обновится по TTL */
      }

      router.push("/admin/recipes");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить рецепт");
      setSaving(false);
      setAutoCalcNutrition(false);
    }
  };

  // Контент для перевода «на лету» (рецепт ещё не в БД, режим создания).
  const buildTranslateContent = () => ({
    title: title.trim(),
    description: description.trim() || null,
    note: note.trim() || null,
    ingredients: ingredients.trim() || null,
    steps: steps.map((s) => ({
      order: s.order,
      title: s.title || null,
      description: s.description,
    })),
  });

  // ── AI cover generation ────────────────────────────────────────────────────
  const handleGenerateCover = async () => {
    if (!title.trim()) { setGenerateError("Сначала введи название рецепта"); return; }
    setGeneratingCover(true);
    setGenerateError(null);
    try {
      const res = await fetch("/api/admin/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          ingredients: ingredients.trim() || undefined,
          recipeId: recipeId || undefined,
          recipeType,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Ошибка ${res.status}`);
      setCoverPreview(json.url);
      setCoverFile(undefined);
    } catch (err: unknown) {
      setGenerateError(err instanceof Error ? err.message : "Не удалось сгенерировать изображение");
    } finally {
      setGeneratingCover(false);
    }
  };

  // ── Translation ────────────────────────────────────────────────────────────
  const handleTranslate = async () => {
    if (!recipeId && !title.trim()) {
      setError("Сначала введи название рецепта");
      return;
    }
    setTranslating(true);
    setTranslateSuccess(false);
    setError(null);
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recipeId ? { recipeId } : { content: buildTranslateContent() }),
      });
      const text = await res.text();
      let json: { error?: string; translations?: { en: Parameters<typeof applyEnTranslations>[0] } } = {};
      try { json = JSON.parse(text); } catch { /* non-JSON */ }
      if (!res.ok) throw new Error(json.error || `Ошибка ${res.status}`);
      // Подтягиваем свежий перевод в форму, чтобы вкладка EN сразу показывала
      // результат, а сохранение не перезатёрло его старыми значениями.
      if (json.translations?.en) applyEnTranslations(json.translations.en);
      setTranslateSuccess(true);
      setTimeout(() => setTranslateSuccess(false), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка перевода");
    } finally {
      setTranslating(false);
    }
  };

  // ── Calculate nutrition (КБЖУ) ─────────────────────────────────────────────
  const handleCalculateNutrition = async () => {
    if (!recipeId) {
      setNutritionError("Сначала сохрани рецепт");
      return;
    }
    setCalculatingNutrition(true);
    setNutritionError(null);
    try {
      const res = await fetch("/api/admin/calculate-nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Кнопка «Пересчитать» форсит расчёт игнорируя кеш (вдруг база ингредиентов обновилась)
        body: JSON.stringify({ recipeId, force: true }),
      });
      const text = await res.text();
      let json: { nutrition?: NutritionData; error?: string } = {};
      try {
        json = JSON.parse(text);
      } catch {
        /* non-JSON */
      }
      if (!res.ok) throw new Error(json.error || `Ошибка ${res.status}`);
      if (!json.nutrition) throw new Error("Сервер не вернул nutrition");
      setFreshNutrition(json.nutrition);
    } catch (err: unknown) {
      setNutritionError(
        err instanceof Error ? err.message : "Не удалось рассчитать КБЖУ",
      );
    } finally {
      setCalculatingNutrition(false);
    }
  };

  // ── Combined: translate → generate cover ──────────────────────────────────
  const handleTranslateAndGenerate = async () => {
    if (!recipeId && !title.trim()) {
      setError("Сначала введи название рецепта");
      return;
    }
    setError(null);
    setGenerateError(null);
    try {
      setCombinedStep("translating");
      const translateRes = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(recipeId ? { recipeId } : { content: buildTranslateContent() }),
      });
      const text = await translateRes.text();
      let json: { error?: string; translations?: { en: Parameters<typeof applyEnTranslations>[0] } } = {};
      try { json = JSON.parse(text); } catch { /* non-JSON */ }
      if (!translateRes.ok) throw new Error(json.error || `Ошибка перевода ${translateRes.status}`);
      if (json.translations?.en) applyEnTranslations(json.translations.en);

      setCombinedStep("generating");
      const genRes = await fetch("/api/admin/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          ingredients: ingredients.trim() || undefined,
          recipeId: recipeId || undefined,
          recipeType,
        }),
      });
      const genJson = await genRes.json();
      if (!genRes.ok) throw new Error(genJson.error || `Ошибка генерации ${genRes.status}`);
      setCoverPreview(genJson.url);
      setCoverFile(undefined);

      setTranslateSuccess(true);
      setTimeout(() => setTranslateSuccess(false), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка");
    } finally {
      setCombinedStep(null);
    }
  };

  // ── Несохранённые изменения (для предупреждения при уходе со страницы) ──────
  const dirtySnapshot = useMemo(
    () =>
      JSON.stringify({
        title, slug, description, note, ingredients, published, featured, recipeType,
        titleEn, descriptionEn, noteEn, ingredientsEn, cookTime, servings,
        cover: coverPreview,
        coverFile: coverFile ? `${coverFile.name}:${coverFile.size}` : null,
        cats: Array.from(selectedCategoryIds).sort(),
        steps: steps.map((s) => ({
          t: s.title, d: s.description, te: s.title_en ?? "", de: s.description_en ?? "",
          p: s.photo_url, pf: s.photoFile ? `${s.photoFile.name}:${s.photoFile.size}` : null,
        })),
      }),
    [title, slug, description, note, ingredients, published, featured, recipeType, titleEn, descriptionEn, noteEn, ingredientsEn, cookTime, servings, coverPreview, coverFile, selectedCategoryIds, steps],
  );
  const initialDirtyRef = useRef<string | null>(null);
  if (initialDirtyRef.current === null) initialDirtyRef.current = dirtySnapshot;
  // Есть ли осмысленное содержимое (включая название из модалки создания).
  const hasContent = Boolean(
    title.trim() || description.trim() || note.trim() || ingredients.trim() ||
      titleEn.trim() || descriptionEn.trim() || noteEn.trim() || ingredientsEn.trim() ||
      coverPreview || coverFile || selectedCategoryIds.size || steps.length ||
      cookTime !== null || servings !== null,
  );
  // Создание: «грязно», если есть содержимое. Редактирование: если что-то изменилось.
  // Во время сохранения — не мешаем редиректу.
  const isDirty = !saving && (recipeId ? dirtySnapshot !== initialDirtyRef.current : hasContent);

  return {
    isDirty,
    // Field values
    title, setTitle,
    slug, setSlug, setSlugEdited,
    description, setDescription,
    note, setNote,
    ingredients, setIngredients,
    published, setPublished,
    featured, setFeatured,
    cookTime, setCookTime,
    servings, setServings,
    recipeType, setRecipeType: changeRecipeType,
    // Language + English content
    formLang, setFormLang,
    titleEn, setTitleEn,
    descriptionEn, setDescriptionEn,
    noteEn, setNoteEn,
    ingredientsEn, setIngredientsEn,
    // Cover
    coverPreview, setCoverPreview,
    coverInputRef,
    handleCoverChange,
    // Categories
    allCategories,
    selectedCategoryIds,
    toggleCategory,
    // Steps
    steps,
    addStep, updateStep, removeStep, moveStep,
    // Submit
    saving, error,
    autoCalcNutrition,
    handleSubmit,
    // AI
    generatingCover, generateError,
    handleGenerateCover,
    // Translation
    translating, translateSuccess,
    handleTranslate,
    // Combined
    combinedStep,
    handleTranslateAndGenerate,
    // Nutrition
    currentNutrition,
    freshNutrition,
    calculatingNutrition,
    nutritionError,
    ingredientsDirty,
    handleCalculateNutrition,
  };
}

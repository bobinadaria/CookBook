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
import type { ImportedRecipe, ImportSource } from "@/lib/recipe-import";

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

  // ── AI cover generation state ──────────────────────────────────────────────
  const [generatingCover, setGeneratingCover] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // ── Импорт рецепта по ссылке (только при создании) ─────────────────────────
  // Поле URL + статус. Применяется ТОЛЬКО к RU-полям (title/description/
  // ingredients/steps/cook_time/servings/recipe_type). Обложка и фото шагов
  // не импортируются сознательно (next/image домены + копирайт). EN-перевод —
  // по кнопке «Перевести» уже после импорта.
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importNotice, setImportNotice] = useState<string | null>(null);

  /** Машиночитаемый код ошибки импорта → понятное сообщение для админки (RU). */
  const importErrorMessage = (code?: string): string => {
    switch (code) {
      case "bad_url":
        return "Некорректная ссылка. Проверь, что URL начинается с https://";
      case "blocked":
        return "Этот адрес заблокирован (приватная сеть или внутренний хост).";
      case "timeout":
        return "Сайт слишком долго отвечает. Попробуй ещё раз или другую ссылку.";
      case "unreachable":
        return "Не удалось открыть страницу. Проверь ссылку и попробуй снова.";
      case "not_recipe":
        return "На странице не получилось найти рецепт.";
      default:
        return "Не удалось импортировать. Попробуй другую ссылку.";
    }
  };

  const handleImportFromUrl = async () => {
    const url = importUrl.trim();
    if (!url || importing) return;
    setImporting(true);
    setImportError(null);
    setImportNotice(null);
    try {
      const res = await fetch("/api/admin/import-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        recipe?: ImportedRecipe;
        source?: ImportSource;
        code?: string;
        error?: string;
      };
      if (!res.ok || !json.recipe) {
        setImportError(json.error || importErrorMessage(json.code));
        return;
      }

      const r = json.recipe;
      // Тип ставим первым: для «напитка» обнуляются время/порции.
      const nextType: "food" | "drink" = r.recipe_type === "drink" ? "drink" : "food";
      changeRecipeType(nextType);

      if (r.title) setTitle(r.title);
      setDescription(r.description ?? "");
      // Состав — по одному ингредиенту на строку (формат админ-формы).
      setIngredients((r.ingredients ?? []).join("\n"));
      setSteps(
        (r.steps ?? []).map((s, i) => ({
          order: i + 1,
          title: s.title ?? "",
          description: s.description ?? "",
          photo_url: null,
        })),
      );
      if (nextType !== "drink") {
        setCookTime(typeof r.cook_time === "number" ? r.cook_time : null);
        setServings(typeof r.servings === "number" ? r.servings : null);
      }
      // КБЖУ пересчитаем по новому составу — старый расчёт не тащим.
      setFreshNutrition(null);

      setImportNotice(
        json.source === "structured"
          ? "Импортировано из микроразметки страницы — данные точные."
          : "AI разобрал страницу — проверь поля перед сохранением.",
      );
      // Не очищаем поле URL: иногда нужно повторить импорт после правок,
      // или скопировать ссылку в заметку.
    } catch {
      setImportError("Не удалось импортировать. Проверь интернет и попробуй ещё раз.");
    } finally {
      setImporting(false);
    }
  };

  // ── Nutrition (КБЖУ) state ─────────────────────────────────────────────────
  const [currentNutrition] = useState<NutritionData | null>(
    defaultValues?.nutrition ?? null,
  );
  const [freshNutrition, setFreshNutrition] = useState<NutritionData | null>(null);
  const [calculatingNutrition, setCalculatingNutrition] = useState(false);
  const [nutritionError, setNutritionError] = useState<string | null>(null);

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
      // КБЖУ считается прямо в форме (как в пользовательской) и сохраняется вместе
      // с рецептом — без отдельного шага «сначала сохрани». Напитки — без КБЖУ.
      nutrition: recipeType === "drink" ? null : (freshNutrition ?? currentNutrition ?? null),
    };

    try {
      let savedId: string | undefined = recipeId;
      if (recipeId) {
        await updateRecipe(recipeId, input);
      } else {
        savedId = await createRecipe(input);
        localStorage.removeItem(DRAFT_KEY);
      }

      // Английская версия для двуязычного сайта создаётся молча, если её ещё нет.
      // Автор пишет по-русски и про перевод не думает (как в пользовательской форме).
      // Не критично для сохранения — на ошибке просто молчим, можно обновить позже.
      if (savedId && !titleEn.trim()) {
        try {
          await fetch("/api/admin/translate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ recipeId: savedId }),
          });
        } catch {
          /* перевод не критичен — EN можно обновить позже */
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
    }
  };

  // ── AI cover generation ────────────────────────────────────────────────────
  // Одна кнопка, один шаг — как в пользовательской форме. Перевод НЕ показываем:
  // если у рецепта уже есть EN в БД (режим редактирования), роут сам подставит
  // английский для более точной картинки; в остальном автор про это не думает.
  const handleGenerateCover = async () => {
    if (!title.trim()) { setGenerateError("Сначала введи название рецепта"); return; }
    setGenerateError(null);
    setGeneratingCover(true);
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

  // ── Calculate nutrition (КБЖУ) ─────────────────────────────────────────────
  // Считаем ПО ТЕКСТУ состава, без сохранения (как в пользовательской форме).
  // Результат кладём в freshNutrition и сохраняем вместе с рецептом — никакого
  // «сначала сохрани рецепт».
  const handleCalculateNutrition = async () => {
    const text = ingredients.trim();
    if (!text) { setNutritionError("Заполни состав — нечего считать"); return; }
    setCalculatingNutrition(true);
    setNutritionError(null);
    try {
      const res = await fetch("/api/admin/calculate-nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: text, servings }),
      });
      const body = await res.text();
      let json: { nutrition?: NutritionData; error?: string } = {};
      try {
        json = JSON.parse(body);
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
    handleSubmit,
    // AI cover
    generatingCover, generateError,
    handleGenerateCover,
    // Nutrition
    currentNutrition,
    freshNutrition,
    /**
     * Открытый сеттер — нужен после resolve-alias, чтобы блок UnmatchedIngredients
     * подсунул в форму новую посчитанную nutrition без повторного OpenAI-вызова.
     */
    setFreshNutrition,
    calculatingNutrition,
    nutritionError,
    handleCalculateNutrition,
    // Import by URL (create mode only)
    importUrl, setImportUrl,
    importing,
    importError,
    importNotice,
    handleImportFromUrl,
  };
}

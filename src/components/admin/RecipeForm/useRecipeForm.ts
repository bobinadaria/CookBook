"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createRecipe,
  updateRecipe,
  fetchCategories,
  toSlug,
} from "@/lib/supabase/recipes";
import type { Category, StepInput, RecipeInput } from "@/types";

const DRAFT_KEY = "cookbook-recipe-draft";

export interface RecipeFormDefaults extends Partial<RecipeInput> {
  cover_image?: string;
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
  const [published, setPublished] = useState(defaultValues?.published ?? false);
  const [featured, setFeatured] = useState(defaultValues?.featured ?? false);

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

  // ── Draft restore (new recipes only) ──────────────────────────────────────
  const draftRestored = useRef(false);
  useEffect(() => {
    if (recipeId || draftRestored.current) return;
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
      if (d.published) setPublished(d.published);
      if (d.featured) setFeatured(d.featured);
      if (d.categoryIds) setSelectedCategoryIds(new Set(d.categoryIds));
      if (d.steps?.length)
        setSteps(d.steps.map((s: StepInput) => ({ ...s, photoFile: undefined })));
    } catch { /* ignore corrupt draft */ }
  }, [recipeId]);

  // ── Auto-save draft (new recipes only) ────────────────────────────────────
  useEffect(() => {
    if (recipeId) return;
    const timer = setTimeout(() => {
      const draft = {
        title, slug, description, note, ingredients, published, featured,
        categoryIds: Array.from(selectedCategoryIds),
        steps: steps.map(({ id, order, title, description, photo_url }) => ({
          id, order, title, description, photo_url,
        })),
      };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }, 500);
    return () => clearTimeout(timer);
  }, [title, slug, description, note, ingredients, published, featured, selectedCategoryIds, steps, recipeId]);

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
      published,
      featured,
      categoryIds: Array.from(selectedCategoryIds),
      steps,
      coverFile,
      cover_image: coverPreview && !coverFile ? coverPreview : undefined,
    };

    try {
      if (recipeId) {
        await updateRecipe(recipeId, input);
      } else {
        await createRecipe(input);
        localStorage.removeItem(DRAFT_KEY);
      }
      router.push("/admin/recipes");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить рецепт");
      setSaving(false);
    }
  };

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
    if (!recipeId) return;
    setTranslating(true);
    setTranslateSuccess(false);
    setError(null);
    try {
      const res = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId }),
      });
      const text = await res.text();
      let json: { error?: string } = {};
      try { json = JSON.parse(text); } catch { /* non-JSON */ }
      if (!res.ok) throw new Error(json.error || `Ошибка ${res.status}`);
      setTranslateSuccess(true);
      setTimeout(() => setTranslateSuccess(false), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка перевода");
    } finally {
      setTranslating(false);
    }
  };

  // ── Combined: translate → generate cover ──────────────────────────────────
  const handleTranslateAndGenerate = async () => {
    if (!recipeId) return;
    setError(null);
    setGenerateError(null);
    try {
      setCombinedStep("translating");
      const translateRes = await fetch("/api/admin/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId }),
      });
      const text = await translateRes.text();
      let json: { error?: string } = {};
      try { json = JSON.parse(text); } catch { /* non-JSON */ }
      if (!translateRes.ok) throw new Error(json.error || `Ошибка перевода ${translateRes.status}`);

      setCombinedStep("generating");
      const genRes = await fetch("/api/admin/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          ingredients: ingredients.trim() || undefined,
          recipeId,
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

  return {
    // Field values
    title, setTitle,
    slug, setSlug, setSlugEdited,
    description, setDescription,
    note, setNote,
    ingredients, setIngredients,
    published, setPublished,
    featured, setFeatured,
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
    // AI
    generatingCover, generateError,
    handleGenerateCover,
    // Translation
    translating, translateSuccess,
    handleTranslate,
    // Combined
    combinedStep,
    handleTranslateAndGenerate,
  };
}

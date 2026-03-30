"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  createRecipe,
  updateRecipe,
  fetchCategories,
  toSlug,
  type StepInput,
  type RecipeInput,
} from "@/lib/supabase/recipes";
import type { Category } from "@/types";

// ── Types ────────────────────────────────────────────────────────────────────

interface RecipeFormProps {
  /** If provided, form is in edit mode */
  recipeId?: string;
  defaultValues?: Partial<RecipeInput & { cover_image: string }>;
}

const CATEGORY_LABELS: Record<string, string> = {
  meal_type: "Тип блюда",
  meal_time: "Приём пищи",
  ingredient: "Ингредиент",
  season: "Сезон / повод",
  country: "Кухня",
};

// ── Sub-components ───────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs text-charcoal/40 uppercase tracking-wider mb-2">
      {children}
    </label>
  );
}

function Input({
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full bg-sand rounded-xl px-4 py-3 text-sm text-charcoal",
        "placeholder:text-charcoal/25 outline-none focus:ring-2 focus:ring-peach/30 transition",
        className
      )}
      {...props}
    />
  );
}

function Textarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={3}
      className={cn(
        "w-full bg-sand rounded-xl px-4 py-3 text-sm text-charcoal resize-none",
        "placeholder:text-charcoal/25 outline-none focus:ring-2 focus:ring-peach/30 transition",
        className
      )}
      {...props}
    />
  );
}

// ── Step editor row ──────────────────────────────────────────────────────────

function StepRow({
  step,
  index,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: {
  step: StepInput;
  index: number;
  onChange: (updated: StepInput) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(step.photo_url);

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    onChange({ ...step, photoFile: file, photo_url: null });
  };

  return (
    <div className="bg-sand/50 border border-sand rounded-2xl p-4 flex gap-4">
      {/* Order + move controls */}
      <div className="flex flex-col items-center gap-1 shrink-0 pt-1">
        <span className="font-serif text-2xl text-charcoal/20 leading-none w-7 text-center">
          {index + 1}
        </span>
        <button
          type="button"
          onClick={onMoveUp}
          disabled={isFirst}
          className="p-1 rounded text-charcoal/30 hover:text-charcoal disabled:opacity-20 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button
          type="button"
          onClick={onMoveDown}
          disabled={isLast}
          className="p-1 rounded text-charcoal/30 hover:text-charcoal disabled:opacity-20 transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Fields */}
      <div className="flex-1 flex flex-col gap-3">
        <Input
          placeholder="Заголовок шага (необязательно)"
          value={step.title}
          onChange={(e) => onChange({ ...step, title: e.target.value })}
        />
        <Textarea
          placeholder="Описание шага *"
          value={step.description}
          rows={2}
          onChange={(e) => onChange({ ...step, description: e.target.value })}
        />

        {/* Photo upload */}
        <div className="flex items-center gap-3">
          {preview ? (
            <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
              <Image src={preview} alt="preview" fill className="object-cover" />
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  onChange({ ...step, photoFile: undefined, photo_url: null });
                }}
                className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity"
              >
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="flex items-center gap-2 text-xs text-charcoal/40 hover:text-peach transition-colors border border-dashed border-charcoal/15 hover:border-peach/40 rounded-xl px-3 py-2"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Добавить фото
            </button>
          )}
          <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
        </div>
      </div>

      {/* Remove */}
      <button
        type="button"
        onClick={onRemove}
        className="p-1.5 self-start rounded-lg text-charcoal/25 hover:text-red-400 hover:bg-red-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

// ── Main form ────────────────────────────────────────────────────────────────

export default function RecipeForm({ recipeId, defaultValues }: RecipeFormProps) {
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Fields
  const [title, setTitle] = useState(defaultValues?.title ?? "");
  const [slug, setSlug] = useState(defaultValues?.slug ?? "");
  const [slugEdited, setSlugEdited] = useState(!!defaultValues?.slug);
  const [description, setDescription] = useState(defaultValues?.description ?? "");
  const [note, setNote] = useState(defaultValues?.note ?? "");
  const [published, setPublished] = useState(defaultValues?.published ?? false);
  const [featured, setFeatured] = useState(defaultValues?.featured ?? false);

  // Cover
  const [coverFile, setCoverFile] = useState<File | undefined>();
  const [coverPreview, setCoverPreview] = useState<string | null>(defaultValues?.cover_image ?? null);

  // Categories
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(
    new Set(defaultValues?.categoryIds ?? [])
  );

  // Steps
  const [steps, setSteps] = useState<StepInput[]>(
    defaultValues?.steps ?? []
  );

  // Submit state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [translateSuccess, setTranslateSuccess] = useState(false);

  // Auto-generate slug from title
  useEffect(() => {
    if (!slugEdited) setSlug(toSlug(title));
  }, [title, slugEdited]);

  // Load categories
  useEffect(() => {
    fetchCategories()
      .then(setAllCategories)
      .catch(() => {});
  }, []);

  // Cover change
  const handleCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  // Category toggle
  const toggleCategory = (id: string) => {
    setSelectedCategoryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // Step helpers
  const addStep = () =>
    setSteps((prev) => [
      ...prev,
      { order: prev.length + 1, title: "", description: "", photo_url: null },
    ]);

  const updateStep = (index: number, updated: StepInput) =>
    setSteps((prev) => prev.map((s, i) => (i === index ? updated : s)));

  const removeStep = (index: number) =>
    setSteps((prev) => prev.filter((_, i) => i !== index).map((s, i) => ({ ...s, order: i + 1 })));

  const moveStep = (index: number, dir: -1 | 1) => {
    setSteps((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next.map((s, i) => ({ ...s, order: i + 1 }));
    });
  };

  // Submit
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
      }
      router.push("/admin/recipes");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Не удалось сохранить рецепт");
      setSaving(false);
    }
  };

  // Translate recipe via Gemini
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
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Translation failed");
      setTranslateSuccess(true);
      setTimeout(() => setTranslateSuccess(false), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Ошибка перевода");
    } finally {
      setTranslating(false);
    }
  };

  // Group categories by type for display
  const grouped = allCategories.reduce<Record<string, Category[]>>((acc, cat) => {
    (acc[cat.type] ??= []).push(cat);
    return acc;
  }, {});

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-10">

      {/* ── Cover image ── */}
      <section>
        <FieldLabel>Фото обложки</FieldLabel>
        <div
          onClick={() => coverInputRef.current?.click()}
          className={cn(
            "relative w-full aspect-[16/7] rounded-2xl overflow-hidden cursor-pointer",
            "border-2 border-dashed border-charcoal/10 hover:border-peach/40 transition-colors",
            coverPreview ? "border-0" : "bg-sand flex items-center justify-center"
          )}
        >
          {coverPreview ? (
            <Image src={coverPreview} alt="cover" fill className="object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-charcoal/30 pointer-events-none">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">Выбрать фото</span>
            </div>
          )}
          {coverPreview && (
            <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
              <span className="opacity-0 hover:opacity-100 text-white text-sm font-medium">
                Заменить
              </span>
            </div>
          )}
        </div>
        <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={handleCover} />
      </section>

      {/* ── Basic fields ── */}
      <section className="flex flex-col gap-5">
        <div>
          <FieldLabel>Название *</FieldLabel>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Тарт с инжиром и рикоттой"
            required
          />
        </div>

        <div>
          <FieldLabel>Slug (URL) *</FieldLabel>
          <Input
            value={slug}
            onChange={(e) => { setSlug(e.target.value); setSlugEdited(true); }}
            placeholder="tart-s-inzhirom"
          />
          <p className="mt-1 text-xs text-charcoal/30">/recipes/{slug || "…"}</p>
        </div>

        <div>
          <FieldLabel>Краткое описание</FieldLabel>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Нежный французский тарт с рикоттой, свежим инжиром и тимьяном"
          />
        </div>

        <div>
          <FieldLabel>История / заметка</FieldLabel>
          <Textarea
            rows={4}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Личная история о блюде — откуда оно появилось, с чем связано..."
          />
          <p className="mt-1 text-xs text-charcoal/30">
            Отображается на странице рецепта в рукописном стиле
          </p>
        </div>
      </section>

      {/* ── Categories ── */}
      <section>
        <FieldLabel>Категории</FieldLabel>
        {Object.keys(grouped).length === 0 ? (
          <p className="text-xs text-charcoal/30">
            Категории не загружены. Добавьте их в разделе{" "}
            <a href="/admin/categories" className="text-peach hover:underline">Категории</a>.
          </p>
        ) : (
          <div className="flex flex-col gap-5">
            {Object.entries(grouped).map(([type, cats]) => (
              <div key={type}>
                <p className="text-xs text-charcoal/40 mb-2">
                  {CATEGORY_LABELS[type] ?? type}
                </p>
                <div className="flex flex-wrap gap-2">
                  {cats.map((cat) => {
                    const active = selectedCategoryIds.has(cat.id);
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategory(cat.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
                          active
                            ? "bg-charcoal text-cream border-charcoal"
                            : "bg-transparent text-charcoal/50 border-charcoal/15 hover:border-charcoal/30 hover:text-charcoal"
                        )}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Steps ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <FieldLabel>Шаги приготовления</FieldLabel>
          <span className="text-xs text-charcoal/30">{steps.length} шагов</span>
        </div>

        <div className="flex flex-col gap-3 mb-4">
          {steps.map((step, i) => (
            <StepRow
              key={i}
              step={step}
              index={i}
              onChange={(updated) => updateStep(i, updated)}
              onRemove={() => removeStep(i)}
              onMoveUp={() => moveStep(i, -1)}
              onMoveDown={() => moveStep(i, 1)}
              isFirst={i === 0}
              isLast={i === steps.length - 1}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={addStep}
          className="flex items-center gap-2 text-sm text-charcoal/50 hover:text-peach transition-colors border border-dashed border-charcoal/15 hover:border-peach/40 rounded-xl px-4 py-3 w-full justify-center"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Добавить шаг
        </button>
      </section>

      {/* ── Publish + submit ── */}
      <section className="flex flex-col gap-4 pb-10">
        {error && (
          <p className="text-sm text-red-400 bg-red-50 rounded-xl px-4 py-3">{error}</p>
        )}

        <label className="flex items-center gap-3 cursor-pointer self-start">
          <div
            role="switch"
            aria-checked={published}
            tabIndex={0}
            onClick={() => setPublished((p) => !p)}
            className={cn(
              "w-11 h-[26px] rounded-full transition-colors duration-200 relative cursor-pointer shrink-0",
              published ? "bg-sage" : "bg-[#d5d0ca]"
            )}
          >
            <span
              className={cn(
                "absolute top-[3px] left-[3px] w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200",
                published && "translate-x-[18px]"
              )}
            />
          </div>
          <span className="text-sm text-charcoal/60">
            {published ? "Опубликован" : "Черновик"}
          </span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer self-start">
          <div
            role="switch"
            aria-checked={featured}
            tabIndex={0}
            onClick={() => setFeatured((f) => !f)}
            className={cn(
              "w-11 h-[26px] rounded-full transition-colors duration-200 relative cursor-pointer shrink-0",
              featured ? "bg-peach" : "bg-[#d5d0ca]"
            )}
          >
            <span
              className={cn(
                "absolute top-[3px] left-[3px] w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200",
                featured && "translate-x-[18px]"
              )}
            />
          </div>
          <span className="text-sm text-charcoal/60">
            Самое любимое блюдо
          </span>
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-charcoal text-cream px-8 py-3.5 rounded-full text-sm font-medium hover:bg-peach transition-colors disabled:opacity-50"
          >
            {saving ? "Сохраняем..." : recipeId ? "Сохранить изменения" : "Создать рецепт"}
          </button>

          {recipeId && (
            <button
              type="button"
              onClick={handleTranslate}
              disabled={translating}
              className={cn(
                "inline-flex items-center gap-2 px-6 py-3.5 rounded-full text-sm font-medium transition-colors disabled:opacity-50",
                translateSuccess
                  ? "bg-sage text-cream"
                  : "bg-sand text-charcoal/70 hover:bg-peach/20 hover:text-peach"
              )}
            >
              {translating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="32" strokeLinecap="round" />
                  </svg>
                  Переводим...
                </>
              ) : translateSuccess ? (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Переведено
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                  </svg>
                  Перевести на EN / CS
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3.5 rounded-full text-sm text-charcoal/50 hover:text-charcoal border border-charcoal/10 hover:border-charcoal/25 transition-colors"
          >
            Отмена
          </button>
        </div>
      </section>
    </form>
  );
}

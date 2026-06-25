"use client";

/**
 * Bilingual (RU/EN) recipe form for the user's private "My cookbook".
 *
 * A lighter sibling of the admin RecipeForm: no publish/featured toggles and no
 * EN-translation control. Premium/Lifetime users (passed via `aiEnabled`) get
 * AI controls visible inline: КБЖУ calculation and AI cover generation
 * (`/api/recipes/generate-image`, the user-facing parallel of the admin route).
 * Cover and step photos are uploaded via the auth-only /api/upload route, then
 * the resulting URLs are sent to the createUserRecipe / updateUserRecipe server
 * actions (which force owner_id / visibility='private' / published=false and
 * enforce the plan limit).
 *
 * Защита от потери данных: пока в форме есть несохранённые правки, уход со
 * страницы (ссылки, «Отмена», закрытие вкладки) спрашивает подтверждение
 * (useUnsavedChangesGuard + ConfirmDialog).
 */

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { EditorialButton, ConfirmDialog, PremiumLock } from "@/components/ui";
import { cn } from "@/lib/utils";
import { fetchWithTimeout, isTimeoutError } from "@/lib/fetch-with-timeout";
import { localizedField } from "@/lib/localized-content";
import { categoryTypesForRecipe } from "@/lib/category-types";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import type { Category, LocaleCode, NutritionData } from "@/types";
import { createUserRecipe, updateUserRecipe } from "@/app/dashboard/recipes/actions";
import type { UserRecipeResult } from "@/app/dashboard/recipes/types";
import {
  PENDING_IMPORT_KEY,
  type ImportedRecipe,
  type ImportSource,
  type PendingImport,
} from "@/lib/recipe-import/types";
import NutritionResolveModal, {
  buildResolveQueue,
} from "@/components/recipe/NutritionResolveModal";

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
  /** Баланс AI-обложек из credit_ledger. null = монетизация выключена (бета, без лимита). */
  coverCredits?: number | null;
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

/**
 * Собирает NutritionData из вручную введённых значений на порцию. Возвращает
 * null, если калории не заданы (нечего сохранять). Помечается manual=true, чтобы
 * в UI не выдавать ручные числа за USDA-точность ±5%.
 */
function buildManualNutrition(
  fields: { kcal: string; protein: string; fat: string; carbs: string },
  servings: number | null,
): NutritionData | null {
  const num = (s: string) => {
    const n = parseFloat(s.replace(",", "."));
    return Number.isFinite(n) && n >= 0 ? n : null;
  };
  const kcal = num(fields.kcal);
  if (kcal == null) return null; // без калорий смысла нет
  const protein = num(fields.protein) ?? 0;
  const fat = num(fields.fat) ?? 0;
  const carbs = num(fields.carbs) ?? 0;
  const portions = servings && servings > 0 ? servings : 1;
  const per_serving = { kcal, protein, fat, carbs };
  return {
    per_serving,
    total: {
      kcal: kcal * portions,
      protein: protein * portions,
      fat: fat * portions,
      carbs: carbs * portions,
      weight_g: 0,
    },
    servings: portions,
    confidence: 1,
    warnings: [],
    ingredients: [],
    manual: true,
    calculated_at: new Date().toISOString(),
    model: "manual",
  };
}

export default function UserRecipeForm({
  categories,
  recipeId,
  defaultValues,
  aiEnabled = false,
  coverCredits = null,
}: UserRecipeFormProps) {
  const t = useTranslations("myRecipes");
  const tn = useTranslations("recipe.nutrition");
  const locale = useLocale() as LocaleCode;
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement>(null);
  // Блок действий (кнопки + ошибки) — чтобы прокрутить к нему при ошибке
  // сохранения: иначе сообщение прячется внизу длинной формы и человек не видит,
  // почему рецепт «молча не сохранился».
  const actionsRef = useRef<HTMLDivElement>(null);

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

  // ── AI-обложка (premium) ──────────────────────────────────────────────────
  // Стейт держится локально, как и КБЖУ-блок. После генерации сразу подменяем
  // превью и обнуляем coverFile, чтобы при сабмите ушёл сгенерированный URL,
  // а не залитый раньше файл (если был).
  const [coverGenLoading, setCoverGenLoading] = useState(false);
  const [coverGenError, setCoverGenError] = useState<string | null>(null);
  const [coverGenDone, setCoverGenDone] = useState(false);
  // Локальный счётчик кредитов — обновляется после генерации без перезагрузки.
  // null = монетизация выключена (бета, без лимита).
  const [creditsLeft, setCreditsLeft] = useState<number | null>(coverCredits ?? null);

  // Когда пользователь возвращается на вкладку (например, после покупки пакета
  // в новой вкладке) — перечитываем актуальный баланс с сервера.
  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const res = await fetch("/api/recipes/cover-credits");
        if (!res.ok) return;
        const json = (await res.json()) as { credits: number | null };
        setCreditsLeft(json.credits);
      } catch {
        // тихо игнорируем — баланс останется локальным
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(
    new Set(defaultValues?.categoryIds ?? []),
  );

  const [steps, setSteps] = useState<StepState[]>(defaultValues?.steps ?? []);

  const [nutrition, setNutrition] = useState<NutritionData | null>(
    defaultValues?.nutrition ?? null,
  );
  const [calcLoading, setCalcLoading] = useState(false);
  const [calcError, setCalcError] = useState<string | null>(null);
  // Модалка пошагового разрешения спорных ингредиентов.
  const [resolveOpen, setResolveOpen] = useState(false);

  // Ручной ввод КБЖУ блюда (для составных/нетиповых блюд). Стартуем в ручном
  // режиме, если у рецепта уже сохранено ручное КБЖУ.
  const manualInit = defaultValues?.nutrition?.manual ? defaultValues.nutrition.per_serving : null;
  const [manualMode, setManualMode] = useState(!!manualInit);
  const [manualKcal, setManualKcal] = useState(manualInit ? String(manualInit.kcal) : "");
  const [manualProtein, setManualProtein] = useState(manualInit ? String(manualInit.protein) : "");
  const [manualFat, setManualFat] = useState(manualInit ? String(manualInit.fat) : "");
  const [manualCarbs, setManualCarbs] = useState(manualInit ? String(manualInit.carbs) : "");

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
      case "js_blocked":
        return t("importErrJsBlocked");
      case "not_recipe":
        return t("importErrNotRecipe");
      default:
        return t("importErrGeneric");
    }
  };

  /**
   * Раскладывает уже распарсенный `ImportedRecipe` по полям формы. Вынесено
   * из handleImport, чтобы тем же кодом мог воспользоваться и второй путь —
   * результат, который положила в sessionStorage модалка создания (режим
   * «Ссылка»), читаем при маунте (см. useEffect ниже). Возвращает true, если
   * состав подтянулся (для решения, показывать «готово» или «частично»).
   */
  const applyImportedRecipe = (r: ImportedRecipe): boolean => {
    const hasIngredients = (r.ingredients ?? []).some((s) => s.trim().length > 0);
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
    return hasIngredients;
  };

  /** Общая обработка результата импорта — общая для ручного клика и для
   * результата, принесённого модалкой через sessionStorage. */
  const applyImportResult = (r: ImportedRecipe, source?: ImportSource) => {
    // Защита от «молчаливого» провала: иногда импорт формально успешен, но
    // вернулся пустой/скудный рецепт. Если нет ни состава, ни шагов, ни
    // названия — честно говорим, что не вышло, и НЕ затираем форму.
    const hasSteps = (r.steps ?? []).length > 0;
    if (!r.title?.trim() && !(r.ingredients ?? []).some((s) => s.trim()) && !hasSteps) {
      setImportError(importErrorMessage("not_recipe"));
      return;
    }
    const hasIngredients = applyImportedRecipe(r);
    if (!hasIngredients) {
      // Поля частично заполнены, но состав не подтянулся — предупреждаем
      // явно (без него не посчитать КБЖУ), а не показываем «готово».
      setImportError(t("importPartial"));
    } else {
      setImportNotice(source === "structured" ? t("importDoneStructured") : t("importDoneAi"));
    }
  };

  const handleImport = async () => {
    const url = importUrl.trim();
    if (!url || importing) return;
    setImporting(true);
    setImportError(null);
    setImportNotice(null);
    try {
      const res = await fetchWithTimeout("/api/recipes/import-url", {
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
      applyImportResult(json.recipe, json.source);
    } catch (e) {
      setImportError(isTimeoutError(e) ? t("importErrTimeout") : t("importErrGeneric"));
    } finally {
      setImporting(false);
    }
  };

  // Результат, который принесла модалка создания (режим «Ссылка») — она сама
  // вызвала /api/recipes/import-url и положила распарсенный рецепт сюда, пока
  // эта страница монтировалась. Применяем один раз и сразу убираем ключ, чтобы
  // обновление страницы не повторило подстановку.
  useEffect(() => {
    if (recipeId) return; // только для нового рецепта
    const raw = sessionStorage.getItem(PENDING_IMPORT_KEY);
    if (!raw) return;
    sessionStorage.removeItem(PENDING_IMPORT_KEY);
    try {
      const pending = JSON.parse(raw) as PendingImport;
      applyImportResult(pending.recipe, pending.source);
    } catch {
      // Битый JSON в sessionStorage — молча игнорируем, форма остаётся пустой.
    }
    // applyImportResult намеренно не в зависимостях: эффект должен сработать
    // ровно раз при маунте (читает sessionStorage и сразу удаляет ключ),
    // а не при каждом ре-рендере, в котором функция пересоздаётся.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipeId]);

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
        manualMode,
        manual: [manualKcal, manualProtein, manualFat, manualCarbs],
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
      manualMode,
      manualKcal,
      manualProtein,
      manualFat,
      manualCarbs,
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
    nutrition !== null ||
    manualKcal.trim() !== "";
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

  // ── AI-генерация обложки (premium) ────────────────────────────────────────
  // Шлёт title/description/ingredients/recipeType в /api/recipes/generate-image
  // (роут гейтит по aiEnabled — premium/lifetime). Возвращённым URL заменяем
  // превью и сбрасываем coverFile, чтобы сабмит отправил именно сгенерированный.
  const handleGenerateCover = async () => {
    if (!title.trim()) {
      setCoverGenError(t("coverAiNeedTitle"));
      return;
    }
    if (coverGenLoading) return;
    setCoverGenLoading(true);
    setCoverGenError(null);
    setCoverGenDone(false);
    try {
      const res = await fetch("/api/recipes/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          ingredients: ingredients.trim() || undefined,
          recipeType,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        setCoverGenError(json.error || t("coverAiError"));
        return;
      }
      setCoverPreview(json.url);
      setCoverFile(undefined);
      setCoverGenDone(true);
      // Уменьшаем локальный счётчик (только если монетизация включена)
      setCreditsLeft((prev) => (prev !== null ? Math.max(0, prev - 1) : null));
    } catch {
      setCoverGenError(t("coverAiError"));
    } finally {
      setCoverGenLoading(false);
    }
  };

  const handleCalcNutrition = async () => {
    if (!ingredients.trim() || calcLoading) return;
    setCalcLoading(true);
    setCalcError(null);
    try {
      const res = await fetchWithTimeout("/api/recipes/calculate-nutrition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients, servings }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCalcError(json.error || t("nutritionError"));
        return;
      }
      const n = json.nutrition as NutritionData;
      setNutrition(n);
      // Есть спорные ингредиенты — сразу открываем пошаговую модалку.
      if (buildResolveQueue(n).length > 0) setResolveOpen(true);
    } catch (e) {
      setCalcError(isTimeoutError(e) ? t("nutritionTimeout") : t("nutritionError"));
    } finally {
      setCalcLoading(false);
    }
  };

  // Показать ошибку И прокрутить к блоку действий, чтобы она была видна
  // (сообщение в самом низу длинной формы иначе остаётся незамеченным).
  const showError = (msg: string) => {
    setError(msg);
    requestAnimationFrame(() =>
      actionsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showError(t("errTitle"));
      return;
    }
    if (steps.some((s) => !s.description.trim())) {
      showError(t("errStep"));
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

      // КБЖУ: у напитков нет; в ручном режиме — собираем из полей; иначе AI-расчёт.
      const effectiveNutrition = isDrink
        ? null
        : manualMode
          ? buildManualNutrition(
              { kcal: manualKcal, protein: manualProtein, fat: manualFat, carbs: manualCarbs },
              servings,
            )
          : nutrition;

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
        nutrition: effectiveNutrition,
      };

      const result: UserRecipeResult = recipeId
        ? await updateUserRecipe(recipeId, payload)
        : await createUserRecipe(payload);

      if (!result.ok) {
        if (result.code === "limit") {
          const limit = result.error.split(":")[1] || "";
          showError(t("errLimit", { limit }));
        } else {
          showError(t("errGeneric"));
        }
        setSaving(false);
        return;
      }

      router.push(`/dashboard/recipes/${result.id}`);
      router.refresh();
    } catch (err) {
      showError(err instanceof Error ? err.message : t("errGeneric"));
      setSaving(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Приватность: явная строка, чтобы пользователь понял — это личная книга. */}
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <span>🔒</span>
          {t("myBookPrivacyNote")}
        </p>

        {/* Ссылка на рецепт — premium-фича, только при создании нового рецепта.
            Бесплатный путь (микроразметка страницы) токены не тратит; фолбэк
            через AI — тратит. Обложку/фото шагов не переносим (next/image +
            копирайт), о чём явно предупреждаем в подсказке.
            Для Free секция видна, но заперта через PremiumLock — не исчезает
            целиком, как раньше (см. docs/RECIPE_IMPORT_AND_PREMIUM_TEASERS_PLAN.md §3). */}
        {!recipeId && (
          <PremiumLock locked={!aiEnabled}>
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
          </PremiumLock>
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
          {/* Cover (square) + AI-генерация (premium) */}
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

            {/* AI-генерация обложки — раньше исчезала целиком для Free, теперь
                видна заперта (PremiumLock), чтобы человек видел, чего лишён.
                Кнопка неактивна, пока нет названия. Сгенерированное превью
                заменяет coverPreview выше. */}
            <PremiumLock locked={!aiEnabled} className="mt-3">
              <div className="border-2 border-ochre/60 bg-ochre/[0.06] p-3">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span className="font-body text-[12px] font-semibold uppercase tracking-[0.14em] text-ochre-dk">
                    {t("coverAiTitle")}
                  </span>
                  <span className="rounded-none bg-ochre-dk px-1.5 py-0.5 font-body text-[9px] font-semibold uppercase tracking-[0.1em] text-paper">
                    {t("coverAiBadge")}
                  </span>
                </div>
                <p className="mb-3 text-[11px] leading-snug text-soft">{t("coverAiHint")}</p>
                {/* Счётчик обложек + докупить. */}
                <div className="mb-3 flex items-center justify-between gap-2 border-t border-ochre/30 pt-2">
                  <span className="font-body text-[11px] text-soft">
                    {creditsLeft === null
                      ? t("coverAiCounterBeta")
                      : t("coverAiCounterN", { count: creditsLeft })}
                  </span>
                  {creditsLeft !== null ? (
                    <a
                      href="/pricing#covers"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-none border border-burg px-2 py-1 font-body text-[10px] font-semibold uppercase tracking-[0.1em] text-burg transition-colors hover:bg-burg hover:text-paper"
                    >
                      {t("coverAiBuy")}
                    </a>
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="cursor-not-allowed rounded-none border border-rule px-2 py-1 font-body text-[10px] font-semibold uppercase tracking-[0.1em] text-muted"
                    >
                      {t("coverAiBuy")}
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleGenerateCover}
                  disabled={coverGenLoading || !title.trim() || creditsLeft === 0}
                  className={cn(
                    "w-full rounded-none border px-3 py-2 text-xs font-medium uppercase tracking-wider transition-colors",
                    "border-burg bg-burg text-paper hover:bg-burg-dk",
                    "disabled:cursor-not-allowed disabled:border-rule disabled:bg-transparent disabled:text-muted",
                  )}
                >
                  {coverGenLoading
                    ? t("coverAiGenerating")
                    : coverPreview
                      ? t("coverAiRegenerate")
                      : t("coverAiButton")}
                </button>
                {!title.trim() && (
                  <p className="mt-2 text-[11px] text-muted">{t("coverAiNeedTitle")}</p>
                )}
                {coverGenError && (
                  <p className="mt-2 text-[11px] text-red-500">{coverGenError}</p>
                )}
                {coverGenDone && !coverGenError && (
                  <p className="mt-2 text-[11px] text-olive">{t("coverAiDone")}</p>
                )}
              </div>
            </PremiumLock>
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

        {/* КБЖУ — только для еды; доступ (aiEnabled) теперь решает не показ,
            а locked-состояние через PremiumLock. Два режима: AI-расчёт по
            составу или ручной ввод (для составных/нетиповых блюд). */}
        {!isDrink && (
          <PremiumLock locked={!aiEnabled}>
            <section className="border border-rule bg-crust/40 p-5">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-wider text-soft">{t("nutritionTitle")}</p>
              <div className="inline-flex gap-1">
                {([false, true] as const).map((manual) => (
                  <button
                    key={String(manual)}
                    type="button"
                    onClick={() => setManualMode(manual)}
                    className={cn(
                      "rounded-none border px-2.5 py-1 text-[11px] uppercase tracking-wider transition-colors",
                      manualMode === manual
                        ? "border-burg bg-burg text-paper"
                        : "border-rule bg-transparent text-soft hover:border-burg hover:text-burg",
                    )}
                  >
                    {manual ? t("nutritionModeManual") : t("nutritionModeAi")}
                  </button>
                ))}
              </div>
            </div>
            <p className="mb-4 text-xs text-muted">
              {manualMode ? t("nutritionManualHint") : t("nutritionHint")}
            </p>

            {manualMode ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {(
                  [
                    ["kcal", manualKcal, setManualKcal, tn("kcal")],
                    ["protein", manualProtein, setManualProtein, tn("protein")],
                    ["fat", manualFat, setManualFat, tn("fat")],
                    ["carbs", manualCarbs, setManualCarbs, tn("carbs")],
                  ] as const
                ).map(([key, val, setter, label]) => (
                  <div key={key}>
                    <label className="mb-1 block text-[11px] uppercase tracking-wider text-soft">
                      {label}
                    </label>
                    <input
                      type="number"
                      min={0}
                      inputMode="decimal"
                      value={val}
                      onChange={(e) => setter(e.target.value)}
                      placeholder={key === "kcal" ? "320" : "0"}
                      className={inputClass}
                    />
                  </div>
                ))}
                <p className="col-span-2 text-[11px] text-muted sm:col-span-4">
                  {t("nutritionManualNote")}
                </p>
              </div>
            ) : (
              <>
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
                      : nutrition && !nutrition.manual
                        ? t("nutritionRecalc")
                        : t("nutritionCalc")}
                  </EditorialButton>
                  {!ingredients.trim() && (
                    <span className="text-xs text-muted">{t("nutritionNeedIngredients")}</span>
                  )}
                  {calcError && <span className="text-sm text-red-500">{calcError}</span>}
                </div>

                {nutrition?.per_serving && !nutrition.manual && (
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

                {/* Тихая пометка: остались спорные ингредиенты — кнопка открывает модалку. */}
                {nutrition &&
                  !nutrition.manual &&
                  buildResolveQueue(nutrition).length > 0 && (
                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 bg-ochre/10 px-4 py-3">
                      <span className="text-xs text-ochre-dk">
                        {t("nutritionApprox", { count: buildResolveQueue(nutrition).length })}
                      </span>
                      <button
                        type="button"
                        onClick={() => setResolveOpen(true)}
                        className="text-xs font-medium text-burg underline underline-offset-2 transition-colors hover:text-burg-dk"
                      >
                        {t("nutritionRefine")}
                      </button>
                    </div>
                  )}
              </>
            )}
          </section>
          </PremiumLock>
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
        <div ref={actionsRef} className="flex flex-col gap-3 border-t border-rule pt-6">
          <div className="flex flex-wrap items-center gap-3">
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

      {/* Пошаговое разрешение спорных ингредиентов КБЖУ. */}
      {resolveOpen && nutrition && !nutrition.manual && (
        <NutritionResolveModal
          nutrition={nutrition}
          ingredientsText={ingredients}
          servings={servings}
          onResolved={(n) => setNutrition(n)}
          onClose={() => setResolveOpen(false)}
        />
      )}
    </>
  );
}

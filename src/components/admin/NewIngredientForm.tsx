"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "grain", label: "Злаки / крупы" },
  { value: "dairy", label: "Молочное" },
  { value: "meat", label: "Мясо" },
  { value: "fish", label: "Рыба" },
  { value: "egg", label: "Яйца" },
  { value: "fat", label: "Жиры / масла" },
  { value: "sweet", label: "Сладкое" },
  { value: "spice", label: "Специи" },
  { value: "vegetable", label: "Овощи" },
  { value: "fruit", label: "Фрукты" },
  { value: "nut", label: "Орехи" },
  { value: "seed", label: "Семена" },
  { value: "other", label: "Другое" },
];

const inputClass =
  "w-full bg-paper rounded-none px-4 py-3 text-sm text-ink placeholder:text-muted outline-none focus:ring-2 focus:ring-burg/30 transition";

interface UsdaResult {
  fdcId: number;
  description: string;
  dataType: string;
  kcal_100g: number;
  protein_100g: number;
  fat_100g: number;
  carbs_100g: number;
}

/**
 * Форма добавления ингредиента в `ingredients_base` со страницы запросов.
 * Значения КБЖУ — на 100 г, по тому же соглашению, что и scripts/seed-*.mjs
 * (сырой продукт, если не оговорено иное в name_ru — см. комментарии в сидах).
 */
export default function NewIngredientForm({
  presetName,
  resolvedRequestNames,
}: {
  presetName: string;
  resolvedRequestNames: string[];
}) {
  const router = useRouter();
  const [nameRu, setNameRu] = useState(presetName);
  const [nameEn, setNameEn] = useState("");
  const [category, setCategory] = useState("other");
  const [kcal, setKcal] = useState("");
  const [protein, setProtein] = useState("");
  const [fat, setFat] = useState("");
  const [carbs, setCarbs] = useState("");
  const [usdaId, setUsdaId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Поиск в USDA FoodData Central — сначала ищем там, не нашли → вручную ──
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [results, setResults] = useState<UsdaResult[] | null>(null);
  const [pickedFdcId, setPickedFdcId] = useState<number | null>(null);

  const handleSearch = async () => {
    if (!nameEn.trim() || searching) return;
    setSearching(true);
    setSearchError(null);
    setResults(null);
    try {
      const res = await fetch(`/api/admin/usda-search?query=${encodeURIComponent(nameEn.trim())}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setSearchError(json.error || "Не удалось искать в USDA");
        return;
      }
      setResults(json.results ?? []);
      if ((json.results ?? []).length === 0) {
        setSearchError("В USDA не нашлось — заполните КБЖУ вручную ниже.");
      }
    } catch {
      setSearchError("Не удалось связаться с USDA — заполните КБЖУ вручную ниже.");
    } finally {
      setSearching(false);
    }
  };

  const pickResult = (r: UsdaResult) => {
    setPickedFdcId(r.fdcId);
    setKcal(String(r.kcal_100g));
    setProtein(String(r.protein_100g));
    setFat(String(r.fat_100g));
    setCarbs(String(r.carbs_100g));
    setUsdaId(String(r.fdcId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const num = (s: string) => Number(s.replace(",", "."));

    try {
      const res = await fetch("/api/admin/ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name_ru: nameRu,
          name_en: nameEn,
          category,
          kcal_100g: num(kcal),
          protein_100g: num(protein) || 0,
          fat_100g: num(fat) || 0,
          carbs_100g: num(carbs) || 0,
          usda_fdc_id: usdaId,
          resolvedRequestNames,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Не удалось сохранить");
        setSaving(false);
        return;
      }
      router.push("/admin/ingredient-requests");
      router.refresh();
    } catch {
      setError("Не удалось сохранить — проверьте соединение");
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5 bg-crust/50 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wider text-soft">
            Название (рус) *
          </label>
          <input
            value={nameRu}
            onChange={(e) => setNameRu(e.target.value)}
            placeholder="лемонграсс"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs uppercase tracking-wider text-soft">
            Название (англ.)
          </label>
          <div className="flex gap-2">
            <input
              value={nameEn}
              onChange={(e) => {
                setNameEn(e.target.value);
                setPickedFdcId(null);
              }}
              placeholder="Lemongrass, raw"
              className={inputClass}
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={!nameEn.trim() || searching}
              className="shrink-0 whitespace-nowrap border border-burg px-4 py-3 text-xs uppercase tracking-wider text-burg transition-colors hover:bg-burg hover:text-paper disabled:cursor-not-allowed disabled:opacity-40"
            >
              {searching ? "Ищу…" : "Искать в USDA"}
            </button>
          </div>
        </div>
      </div>

      {(results || searchError) && (
        <div>
          {results && results.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-xs uppercase tracking-wider text-soft">
                Нашлось в USDA — выберите подходящее:
              </p>
              {results.map((r) => (
                <button
                  key={r.fdcId}
                  type="button"
                  onClick={() => pickResult(r)}
                  className={
                    "flex items-center justify-between gap-4 border px-4 py-2.5 text-left text-sm transition-colors " +
                    (pickedFdcId === r.fdcId
                      ? "border-burg bg-burg/5 text-burg"
                      : "border-rule text-ink hover:border-burg")
                  }
                >
                  <span className="min-w-0 flex-1 truncate">{r.description}</span>
                  <span className="shrink-0 whitespace-nowrap text-xs text-soft">
                    {r.kcal_100g} ккал · Б{r.protein_100g} Ж{r.fat_100g} У{r.carbs_100g}
                  </span>
                </button>
              ))}
            </div>
          )}
          {searchError && <p className="mt-2 text-sm text-ochre-dk">{searchError}</p>}
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-xs uppercase tracking-wider text-soft">Категория</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={inputClass + " cursor-pointer"}
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <p className="mb-1.5 text-xs uppercase tracking-wider text-soft">КБЖУ на 100 г сырого продукта</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <input
            value={kcal}
            onChange={(e) => setKcal(e.target.value)}
            placeholder="ккал *"
            inputMode="decimal"
            required
            className={inputClass}
          />
          <input
            value={protein}
            onChange={(e) => setProtein(e.target.value)}
            placeholder="белки"
            inputMode="decimal"
            className={inputClass}
          />
          <input
            value={fat}
            onChange={(e) => setFat(e.target.value)}
            placeholder="жиры"
            inputMode="decimal"
            className={inputClass}
          />
          <input
            value={carbs}
            onChange={(e) => setCarbs(e.target.value)}
            placeholder="углеводы"
            inputMode="decimal"
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-xs uppercase tracking-wider text-soft">
          USDA FDC ID (если знаете)
        </label>
        <input
          value={usdaId}
          onChange={(e) => setUsdaId(e.target.value)}
          placeholder="напр. 169244"
          className={inputClass}
        />
      </div>

      {resolvedRequestNames.length > 0 && (
        <p className="text-xs text-muted">
          После сохранения запрос «{resolvedRequestNames.join(", ")}» уберётся из очереди.
        </p>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving || !nameRu.trim() || !kcal}
          className="bg-burg text-paper px-6 py-3 rounded-none text-sm font-medium hover:bg-burg-dk transition-colors disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Сохраняю…" : "Добавить в базу"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          disabled={saving}
          className="px-5 py-3 rounded-none text-sm text-soft border border-rule hover:border-burg hover:text-burg transition-colors"
        >
          Отмена
        </button>
      </div>
    </form>
  );
}

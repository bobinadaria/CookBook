"use client";

import { cn } from "@/lib/utils";
import { DISPLAYED_CATEGORY_TYPES } from "@/lib/category-types";
import type { Category } from "@/types";

const CATEGORY_LABELS: Record<string, string> = {
  meal_type:  "Тип блюда",
  country:    "Кухня",
  season:     "Сезон / повод",
  ingredient: "Ингредиент",
};

interface CategoriesSectionProps {
  allCategories: Category[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}

export default function CategoriesSection({ allCategories, selectedIds, onToggle }: CategoriesSectionProps) {
  const grouped = allCategories.reduce<Record<string, Category[]>>((acc, cat) => {
    (acc[cat.type] ??= []).push(cat);
    return acc;
  }, {});

  // Показываем только актуальные типы фильтров, в фиксированном порядке.
  // meal_time и старый category в пикер не выводим (см. lib/category-types).
  const orderedTypes = DISPLAYED_CATEGORY_TYPES.filter((t) => grouped[t]?.length);

  return (
    <section>
      <label className="block text-xs text-soft uppercase tracking-wider mb-4">
        Категории
      </label>

      {orderedTypes.length === 0 ? (
        <p className="text-xs text-muted">
          Категории не загружены. Добавьте их в разделе{" "}
          <a href="/admin/categories" className="text-ochre-dk hover:underline">Категории</a>.
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {orderedTypes.map((type) => [type, grouped[type]] as const).map(([type, cats]) => (
            <div key={type}>
              <p className="text-xs text-soft mb-2">
                {CATEGORY_LABELS[type] ?? type}
              </p>
              <div className="flex flex-wrap gap-2">
                {cats.map((cat) => {
                  const active = selectedIds.has(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => onToggle(cat.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-none text-xs font-medium border transition-all",
                        active
                          ? "bg-burg text-paper border-burg"
                          : "bg-transparent text-soft border-rule hover:border-burg hover:text-burg"
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
  );
}

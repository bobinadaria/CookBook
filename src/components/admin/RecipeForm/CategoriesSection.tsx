"use client";

import { cn } from "@/lib/utils";
import type { Category } from "@/types";

const CATEGORY_LABELS: Record<string, string> = {
  meal_type:  "Тип блюда",
  meal_time:  "Приём пищи",
  ingredient: "Ингредиент",
  season:     "Сезон / повод",
  country:    "Кухня",
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

  return (
    <section>
      <label className="block text-xs text-charcoal/40 uppercase tracking-wider mb-4">
        Категории
      </label>

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
                  const active = selectedIds.has(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => onToggle(cat.id)}
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
  );
}

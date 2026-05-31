"use client";

import { cn } from "@/lib/utils";

interface ActionsSectionProps {
  recipeId?: string;
  published: boolean;
  featured: boolean;
  saving: boolean;
  error: string | null;
  onTogglePublished: () => void;
  onToggleFeatured: () => void;
  onCancel: () => void;
}

function Toggle({
  checked,
  onToggle,
  label,
  activeColor,
}: {
  checked: boolean;
  onToggle: () => void;
  label: string;
  activeColor: "sage" | "peach";
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer self-start">
      <div
        role="switch"
        aria-checked={checked}
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => e.key === "Enter" && onToggle()}
        className={cn(
          "w-11 h-[26px] rounded-full transition-colors duration-200 relative cursor-pointer shrink-0",
          checked
            ? activeColor === "sage" ? "bg-olive" : "bg-burg"
            : "bg-[#d5d0ca]"
        )}
      >
        <span
          className={cn(
            "absolute top-[3px] left-[3px] w-5 h-5 bg-paper rounded-full shadow-sm transition-transform duration-200",
            checked && "translate-x-[18px]"
          )}
        />
      </div>
      <span className="text-sm text-soft">{label}</span>
    </label>
  );
}

export default function ActionsSection({
  recipeId, published, featured, saving, error,
  onTogglePublished, onToggleFeatured, onCancel,
}: ActionsSectionProps) {
  return (
    <section className="flex flex-col gap-4 pb-10">
      {error && (
        <p className="text-sm text-red-400 bg-red-50 rounded-none px-4 py-3">{error}</p>
      )}

      <Toggle
        checked={published}
        onToggle={onTogglePublished}
        label={published ? "Опубликован" : "Черновик"}
        activeColor="sage"
      />
      <Toggle
        checked={featured}
        onToggle={onToggleFeatured}
        label="Самое любимое блюдо"
        activeColor="peach"
      />

      <div className="flex flex-wrap gap-3">
        {/* Главное действие. КБЖУ уже посчитано в форме и уйдёт в сохранение;
            английская версия (для двуязычного сайта) создаётся молча. */}
        <button
          type="submit"
          disabled={saving}
          className="bg-burg text-paper px-8 py-3.5 rounded-none text-sm font-medium hover:bg-burg-dk transition-colors disabled:opacity-50"
        >
          {saving ? "Сохраняем..." : recipeId ? "Сохранить изменения" : "Создать рецепт"}
        </button>

        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-3.5 rounded-none text-sm text-soft hover:text-burg border border-rule hover:border-burg transition-colors"
        >
          Отмена
        </button>
      </div>
    </section>
  );
}

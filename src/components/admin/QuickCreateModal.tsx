"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui";

interface QuickCreateModalProps {
  onClose: () => void;
}

export default function QuickCreateModal({ onClose }: QuickCreateModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"food" | "drink">("food");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Focus input on open
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !saving) onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [saving, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) { setError("Введи название"); return; }

    setSaving(true);
    setError(null);
    // Не создаём пустой черновик в БД заранее — ведём на полную форму создания
    // с подставленным названием. Рецепт появится в базе только после «Создать
    // рецепт» и по умолчанию будет опубликован (см. useRecipeForm). Это убирает
    // «осиротевшие» пустые черновики и неожиданный статус «Черновик».
    router.push(`/admin/recipes/new?title=${encodeURIComponent(trimmed)}&type=${type}`);
    // keep modal open (spinner) while navigating — router.push is async
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
    >
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-burg/30 backdrop-blur-sm" />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-paper rounded-3xl shadow-2xl p-8 flex flex-col gap-6 text-left">

        {/* Header */}
        <div>
          <span className="font-display italic text-ochre-dk text-lg block mb-1">новый рецепт</span>
          <h2 className="font-display text-3xl text-ink leading-tight">
            Как называется блюдо?
          </h2>
          <p className="text-sm text-soft mt-1.5">
            Введи название и выбери тип — остальное заполнишь на следующем шаге
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => { setTitle(e.target.value); setError(null); }}
            placeholder="Например: Тарт с инжиром и рикоттой"
            disabled={saving}
            className="w-full bg-crust rounded-none px-5 py-4 text-base text-ink
                       placeholder:text-muted outline-none focus:ring-2 focus:ring-burg/30
                       transition disabled:opacity-50"
          />

          {/* Тип: еда / напиток */}
          <div>
            <label className="block text-xs text-soft uppercase tracking-wider mb-2">Тип</label>
            <div className="inline-flex gap-2">
              {(["food", "drink"] as const).map((tp) => (
                <button
                  key={tp}
                  type="button"
                  onClick={() => setType(tp)}
                  disabled={saving}
                  className={cn(
                    "rounded-none border px-5 py-2.5 text-sm transition-colors disabled:opacity-50",
                    type === tp
                      ? "border-burg bg-burg text-paper"
                      : "border-rule bg-crust text-soft hover:text-burg",
                  )}
                >
                  {tp === "food" ? "Еда" : "Напиток"}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-50 rounded-none px-4 py-2.5">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="flex-1 bg-burg text-paper py-3.5 rounded-none text-sm font-medium
                         hover:bg-burg-dk transition-colors disabled:opacity-40 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <Spinner size="sm" className="text-current" />
                  Создаём…
                </>
              ) : (
                "Продолжить →"
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-5 py-3.5 rounded-none text-sm text-soft hover:text-burg
                         border border-rule hover:border-burg transition-colors
                         disabled:opacity-40"
            >
              Отмена
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createDraftRecipe } from "@/lib/supabase/recipes";
import { Spinner } from "@/components/ui";

interface QuickCreateModalProps {
  onClose: () => void;
}

export default function QuickCreateModal({ onClose }: QuickCreateModalProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
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
    try {
      const { id } = await createDraftRecipe(trimmed);
      router.push(`/admin/recipes/${id}/edit`);
      // keep modal open while navigating — router.push is async
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Не удалось создать рецепт");
      setSaving(false);
    }
  };

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onClose(); }}
    >
      {/* Blur overlay */}
      <div className="absolute inset-0 bg-charcoal/30 backdrop-blur-sm" />

      {/* Panel */}
      <div className="relative w-full max-w-md bg-cream rounded-3xl shadow-2xl p-8 flex flex-col gap-6">

        {/* Header */}
        <div>
          <span className="font-handwritten text-peach text-lg block mb-1">новый рецепт</span>
          <h2 className="font-serif text-3xl text-charcoal leading-tight">
            Как называется блюдо?
          </h2>
          <p className="text-sm text-charcoal/40 mt-1.5">
            Введи название — остальное заполнишь на следующем шаге
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
            className="w-full bg-sand rounded-2xl px-5 py-4 text-base text-charcoal
                       placeholder:text-charcoal/25 outline-none focus:ring-2 focus:ring-peach/30
                       transition disabled:opacity-50"
          />

          {error && (
            <p className="text-sm text-red-400 bg-red-50 rounded-xl px-4 py-2.5">{error}</p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="flex-1 bg-charcoal text-cream py-3.5 rounded-full text-sm font-medium
                         hover:bg-peach transition-colors disabled:opacity-40 disabled:cursor-not-allowed
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
              className="px-5 py-3.5 rounded-full text-sm text-charcoal/50 hover:text-charcoal
                         border border-charcoal/10 hover:border-charcoal/25 transition-colors
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

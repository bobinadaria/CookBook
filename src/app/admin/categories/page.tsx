"use client";

import { useCallback, useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { toSlug } from "@/lib/supabase/recipes";
import type { Category, CategoryType } from "@/types";

const CATEGORY_TYPES: { value: CategoryType; label: string }[] = [
  { value: "meal_type", label: "Тип блюда" },
  { value: "meal_time", label: "Приём пищи" },
  { value: "ingredient", label: "Ингредиент" },
  { value: "season", label: "Сезон / повод" },
  { value: "country", label: "Кухня" },
];

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // New category form
  const [name, setName] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [type, setType] = useState<CategoryType>("meal_type");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editNameEn, setEditNameEn] = useState("");
  const [editType, setEditType] = useState<CategoryType>("meal_type");

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("type")
      .order("name");
    setCategories(data ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);

    const supabase = createClient();
    const slug = toSlug(name);
    const { error: err } = await supabase
      .from("categories")
      .insert({ name: name.trim(), name_en: nameEn.trim() || null, slug, type });

    if (err) {
      setError(err.message.includes("duplicate") ? "Категория с таким slug уже существует" : err.message);
    } else {
      setName("");
      setNameEn("");
      await load();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    const supabase = createClient();
    await supabase.from("categories").delete().eq("id", id);
    await load();
  };

  const startEdit = (cat: Category) => {
    setEditId(cat.id);
    setEditName(cat.name);
    setEditNameEn(cat.name_en ?? "");
    setEditType(cat.type);
  };

  const handleEditSave = async () => {
    if (!editId || !editName.trim()) return;
    const supabase = createClient();
    await supabase
      .from("categories")
      .update({ name: editName.trim(), name_en: editNameEn.trim() || null, slug: toSlug(editName), type: editType })
      .eq("id", editId);
    setEditId(null);
    await load();
  };

  // Group by type
  const grouped = categories.reduce<Record<string, Category[]>>((acc, cat) => {
    (acc[cat.type] ??= []).push(cat);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-10 py-8">
      {/* Header */}
      <div>
        <span className="font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-ochre-dk block mb-2">организация</span>
        <h1 className="font-display text-4xl tracking-[-0.02em] text-burg">Категории</h1>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="bg-crust/50 rounded-none p-6 flex flex-col gap-4">
        <p className="text-xs text-soft uppercase tracking-wider">Добавить категорию</p>
        <div className="flex flex-wrap gap-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название (рус)"
            className="flex-1 min-w-[160px] bg-paper rounded-none px-4 py-3 text-sm text-ink placeholder:text-muted outline-none focus:ring-2 focus:ring-burg/30 transition"
          />
          <input
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            placeholder="Название (англ.)"
            className="flex-1 min-w-[160px] bg-paper rounded-none px-4 py-3 text-sm text-ink placeholder:text-muted outline-none focus:ring-2 focus:ring-burg/30 transition"
          />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as CategoryType)}
            className="bg-paper rounded-none px-4 py-3 text-sm text-ink outline-none focus:ring-2 focus:ring-burg/30 transition cursor-pointer"
          >
            {CATEGORY_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={saving || !name.trim()}
            className="bg-burg text-paper px-6 py-3 rounded-none text-sm font-medium hover:bg-burg-dk transition-colors disabled:opacity-50"
          >
            {saving ? "..." : "Добавить"}
          </button>
        </div>
        {name.trim() && (
          <p className="text-xs text-muted">slug: {toSlug(name)}</p>
        )}
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
      </form>

      {/* Categories list grouped by type */}
      {loading ? (
        <p className="text-muted text-sm">Загрузка...</p>
      ) : categories.length === 0 ? (
        <p className="text-muted text-sm">Нет категорий. Добавьте первую выше.</p>
      ) : (
        <div className="flex flex-col gap-8">
          {CATEGORY_TYPES.map(({ value, label }) => {
            const cats = grouped[value];
            if (!cats?.length) return null;
            return (
              <div key={value}>
                <p className="text-xs text-soft uppercase tracking-wider mb-3">{label}</p>
                <div className="flex flex-wrap gap-2">
                  {cats.map((cat) => (
                    <div key={cat.id} className="group relative">
                      {editId === cat.id ? (
                        <div className="flex items-center gap-2 bg-crust rounded-none px-3 py-1.5">
                          <input
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="bg-transparent text-xs text-ink outline-none w-20"
                            placeholder="рус"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleEditSave();
                              if (e.key === "Escape") setEditId(null);
                            }}
                          />
                          <input
                            value={editNameEn}
                            onChange={(e) => setEditNameEn(e.target.value)}
                            className="bg-transparent text-xs text-soft outline-none w-20"
                            placeholder="англ."
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleEditSave();
                              if (e.key === "Escape") setEditId(null);
                            }}
                          />
                          <select
                            value={editType}
                            onChange={(e) => setEditType(e.target.value as CategoryType)}
                            className="bg-transparent text-xs text-ink outline-none cursor-pointer"
                          >
                            {CATEGORY_TYPES.map((t) => (
                              <option key={t.value} value={t.value}>{t.label}</option>
                            ))}
                          </select>
                          <button
                            onClick={handleEditSave}
                            className="text-olive hover:text-olive text-xs font-medium"
                          >
                            OK
                          </button>
                        </div>
                      ) : (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-none text-xs font-medium",
                            "bg-crust/70 text-soft border border-rule",
                            "hover:border-burg transition-all cursor-default"
                          )}
                        >
                          {cat.name}
                          <button
                            onClick={() => startEdit(cat)}
                            className="opacity-0 group-hover:opacity-100 text-muted hover:text-ochre-dk transition-all ml-0.5"
                            title="Редактировать"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted hover:text-red-400 transition-all"
                            title="Удалить"
                          >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

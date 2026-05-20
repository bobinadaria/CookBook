"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";

/**
 * Приватная заметка пользователя к рецепту.
 *
 * Клиентский island внутри (кешируемой) серверной страницы рецепта — личные
 * данные не должны попадать в общий HTML-кеш. Доступ к user_notes защищён RLS
 * (юзер видит только свои), поэтому работаем обычным browser-клиентом.
 *
 * Пустая заметка при сохранении удаляется (отдельная кнопка delete не нужна).
 */
export default function RecipeNote({ recipeId }: { recipeId: string }) {
  const t = useTranslations("userNote");
  // undefined — ещё проверяем сессию; null — аноним; string — userId
  const [userId, setUserId] = useState<string | null | undefined>(undefined);
  const [content, setContent] = useState("");
  const [initial, setInitial] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) {
        setUserId(null);
        return;
      }
      setUserId(user.id);
      const { data } = await supabase
        .from("user_notes")
        .select("content")
        .eq("recipe_id", recipeId)
        .maybeSingle();
      const c = data?.content ?? "";
      setContent(c);
      setInitial(c);
    });
  }, [recipeId]);

  // Пока проверяем сессию — ничего не рендерим (без мигания)
  if (userId === undefined) return null;

  // Аноним — мягкое приглашение войти
  if (userId === null) {
    return (
      <section className="px-6 pb-12 max-w-5xl mx-auto">
        <p className="text-sm text-charcoal/40">
          <Link href="/login" className="text-peach hover:underline">
            {t("loginPrompt")}
          </Link>
        </p>
      </section>
    );
  }

  const dirty = content.trim() !== initial.trim();

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }

    const trimmed = content.trim();
    if (!trimmed) {
      // Пустая заметка → удаляем
      await supabase.from("user_notes").delete().eq("recipe_id", recipeId);
      setInitial("");
    } else {
      await supabase.from("user_notes").upsert(
        {
          user_id: user.id,
          recipe_id: recipeId,
          content: trimmed,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,recipe_id" },
      );
      setInitial(trimmed);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <section className="px-6 pb-12 max-w-5xl mx-auto">
      <div className="bg-cream border border-sand rounded-card p-6 md:p-8">
        <div className="flex items-center justify-between mb-3">
          <span className="font-handwritten text-peach text-lg">{t("title")}</span>
          <span className="text-xs text-charcoal/30">{t("private")}</span>
        </div>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          placeholder={t("placeholder")}
          className="w-full bg-sand/50 rounded-xl px-4 py-3 text-sm text-charcoal placeholder:text-charcoal/30 outline-none focus:ring-2 focus:ring-peach/30 transition resize-none"
        />
        <div className="flex items-center gap-3 mt-3">
          <Button onClick={handleSave} loading={saving} disabled={!dirty} size="sm">
            {t("save")}
          </Button>
          {saved && <span className="text-xs text-sage-dark">{t("saved")}</span>}
        </div>
      </div>
    </section>
  );
}

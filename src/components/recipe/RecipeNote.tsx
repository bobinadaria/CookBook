"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { EditorialButton, Eyebrow } from "@/components/ui";

/**
 * Приватная заметка пользователя к рецепту (magazine-стиль).
 *
 * Клиентский island внутри (кешируемой) серверной страницы рецепта — личные
 * данные не попадают в общий HTML-кеш. Доступ к user_notes защищён RLS.
 * Пустая заметка при сохранении удаляется.
 *
 * Рендерит только внутренний блок (eyebrow + box) — без section/px/max-width;
 * раскладку колонки задаёт страница рецепта.
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
      <div>
        <Eyebrow color="text-ochre-dk">{t("title")}</Eyebrow>
        <div className="mt-3.5 border border-dashed border-rule bg-paper px-6 py-7 font-reader text-[16px] italic leading-relaxed text-muted">
          <Link href="/login" className="text-ochre-dk underline underline-offset-2 transition-colors hover:text-burg">
            {t("loginPrompt")}
          </Link>
        </div>
      </div>
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
    <div>
      <Eyebrow color="text-ochre-dk">{t("title")}</Eyebrow>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={5}
        placeholder={t("placeholder")}
        className="mt-3.5 w-full resize-none border border-dashed border-rule bg-paper px-5 py-4 font-reader text-[16px] italic leading-relaxed text-ink outline-none transition placeholder:text-muted focus:border-ochre"
      />
      <div className="mt-3.5 flex items-center justify-between gap-3">
        <span className="font-body text-[10px] font-semibold uppercase tracking-[0.16em] text-soft">
          {t("private")}
        </span>
        <span className="flex items-center gap-3">
          {saved && (
            <span className="font-body text-[11px] uppercase tracking-[0.13em] text-olive">{t("saved")}</span>
          )}
          <EditorialButton
            variant="ghost"
            onClick={handleSave}
            disabled={!dirty || saving}
            className="px-5 py-2.5 text-[11px]"
          >
            {t("save")}
          </EditorialButton>
        </span>
      </div>
    </div>
  );
}

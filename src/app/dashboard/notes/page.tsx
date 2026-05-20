"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { useFavorites } from "@/context/FavoritesContext";
import { createClient } from "@/lib/supabase/client";
import { localizedField } from "@/lib/localized-content";
import type { LocaleCode } from "@/types";

interface NoteRow {
  content: string;
  updated_at: string;
  recipe: {
    id: string;
    title: string;
    title_en: string | null;
    slug: string;
    cover_image: string | null;
  } | null;
}

export default function NotesPage() {
  const t = useTranslations("notes");
  const tc = useTranslations("common");
  const locale = useLocale() as LocaleCode;
  const { user } = useFavorites();
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("user_notes")
      .select("content, updated_at, recipe:recipes(id, title, title_en, slug, cover_image)")
      .order("updated_at", { ascending: false })
      .then(({ data }) => {
        // recipe приходит как объект (или null, если рецепт удалён)
        const rows = (data ?? []).map((r) => ({
          content: r.content as string,
          updated_at: r.updated_at as string,
          recipe: (Array.isArray(r.recipe) ? r.recipe[0] : r.recipe) ?? null,
        })) as NoteRow[];
        setNotes(rows.filter((n) => n.recipe && n.content?.trim()));
        setLoading(false);
      });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user || loading) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <span className="font-handwritten text-2xl text-charcoal/30">{tc("loading")}</span>
      </div>
    );
  }

  return (
    <main className="px-6 pb-24 max-w-5xl mx-auto">
      <div className="pt-8 pb-8">
        <span className="font-handwritten text-peach text-xl block mb-2">{t("tagline")}</span>
        <h1 className="font-serif text-[clamp(2.2rem,5vw,3.5rem)] leading-none text-charcoal">
          {t("title")}
        </h1>
      </div>

      {notes.length === 0 ? (
        <div className="text-center py-24">
          <p className="font-handwritten text-3xl text-charcoal/25 mb-4">{t("empty")}</p>
          <p className="text-sm text-charcoal/40 mb-8">{t("emptyHint")}</p>
          <Link href="/recipes" className="inline-flex items-center gap-2 text-sm text-peach hover:underline">
            {t("goToRecipes")}
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {notes.map((n) => (
            <Link
              key={n.recipe!.id}
              href={`/recipes/${n.recipe!.slug}`}
              className="group flex gap-4 bg-sand/50 rounded-2xl p-4 hover:bg-sand transition-colors"
            >
              <div className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-sand">
                {n.recipe!.cover_image && (
                  <Image
                    src={n.recipe!.cover_image}
                    alt={n.recipe!.title}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-medium text-charcoal group-hover:text-peach transition-colors mb-1">
                  {localizedField(n.recipe!, "title", locale) ?? n.recipe!.title}
                </h3>
                <p className="text-sm text-charcoal/60 line-clamp-3 whitespace-pre-wrap">
                  {n.content}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}

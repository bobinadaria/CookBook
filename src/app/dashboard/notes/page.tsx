"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { useFavorites } from "@/context/FavoritesContext";
import { createClient } from "@/lib/supabase/client";
import { localizedField } from "@/lib/localized-content";
import { EditorialButton, Eyebrow } from "@/components/ui";
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
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="font-display text-2xl italic text-muted">{tc("loading")}</span>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 pb-24">
      <div className="pb-8 pt-8">
        <Eyebrow color="text-ochre-dk">{t("tagline")}</Eyebrow>
        <h1 className="mt-3 font-display text-[clamp(2.2rem,5vw,3.5rem)] font-normal leading-[0.95] tracking-[-0.02em] text-burg">
          {t("title")}
        </h1>
      </div>

      {notes.length === 0 ? (
        <div className="border-t border-rule py-24 text-center">
          <p className="mb-4 font-display text-[28px] italic text-burg/40">{t("empty")}</p>
          <p className="mb-8 font-body text-sm text-soft">{t("emptyHint")}</p>
          <div className="flex justify-center">
            <EditorialButton variant="ghost" href="/recipes">
              {t("goToRecipes")}
            </EditorialButton>
          </div>
        </div>
      ) : (
        <div className="flex flex-col">
          {notes.map((n) => (
            <Link
              key={n.recipe!.id}
              href={`/recipes/${n.recipe!.slug}`}
              className="group flex gap-5 border-t border-rule py-5 transition-colors first:border-t-0 hover:bg-crust/50"
            >
              <div className="relative h-20 w-20 shrink-0 overflow-hidden bg-crust">
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
                <h3 className="mb-1 font-display text-[18px] text-burg transition-colors group-hover:text-ochre-dk">
                  {localizedField(n.recipe!, "title", locale) ?? n.recipe!.title}
                </h3>
                <p className="line-clamp-3 whitespace-pre-wrap font-reader text-sm leading-relaxed text-soft">
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

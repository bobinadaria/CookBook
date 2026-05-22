"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useFavorites } from "@/context/FavoritesContext";
import { createClient } from "@/lib/supabase/client";
import { EditorialButton, Eyebrow } from "@/components/ui";
import PlanBanner from "./PlanBanner";

/** Ключ приветствия по времени суток (локальное время браузера). */
function greetingKey(): "greetingMorning" | "greetingDay" | "greetingEvening" | "greetingNight" {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return "greetingMorning";
  if (h >= 12 && h < 18) return "greetingDay";
  if (h >= 18 && h < 23) return "greetingEvening";
  return "greetingNight";
}

export default function DashboardHomePage() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const { user, favorites } = useFavorites();
  const [notesCount, setNotesCount] = useState<number | null>(null);
  const [recipesCount, setRecipesCount] = useState<number | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("user_notes")
      .select("id", { count: "exact", head: true })
      .then(({ count }) => setNotesCount(count ?? 0));
    supabase
      .from("recipes")
      .select("id", { count: "exact", head: true })
      .eq("owner_id", user.id)
      .then(({ count }) => setRecipesCount(count ?? 0));
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const n = data?.display_name ?? user.email?.split("@")[0] ?? "";
        setDisplayName(n);
        setNameDraft(n);
      });
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleSaveName = async () => {
    if (!user) return;
    const next = nameDraft.trim();
    if (!next || next === displayName) return;
    setSavingName(true);
    setNameSaved(false);
    const supabase = createClient();
    await supabase.from("profiles").update({ display_name: next }).eq("id", user.id);
    setDisplayName(next);
    setSavingName(false);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2500);
  };

  // middleware гарантирует сессию, но на момент гидрации user может быть null
  if (!user) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <span className="font-display text-2xl italic text-muted">{tc("loading")}</span>
      </div>
    );
  }

  const name = displayName || user.email?.split("@")[0] || "";

  return (
    <main className="mx-auto max-w-5xl px-6 pb-24">
      <div className="pb-10 pt-8">
        <Eyebrow color="text-ochre-dk">{t("tagline")}</Eyebrow>
        <h1 className="mt-3 font-display text-[clamp(2.2rem,5vw,3.5rem)] font-normal leading-[0.95] tracking-[-0.02em] text-burg">
          {t(greetingKey(), { name })}
        </h1>
      </div>

      {/* План + кредиты (каркас под монетизацию) */}
      <PlanBanner />

      {/* Карточки разделов */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link href="/dashboard/recipes" className="group bg-crust p-7 transition-colors hover:bg-crust/70">
          <Eyebrow color="text-soft">{t("myRecipesTitle")}</Eyebrow>
          <p className="mb-1 mt-2 font-display text-4xl text-burg transition-colors group-hover:text-ochre-dk">
            {recipesCount ?? "—"}
          </p>
          <p className="font-body text-sm text-soft">{t("myRecipesDesc")}</p>
        </Link>

        <Link href="/dashboard/favorites" className="group bg-crust p-7 transition-colors hover:bg-crust/70">
          <Eyebrow color="text-soft">{t("favoritesTitle")}</Eyebrow>
          <p className="mb-1 mt-2 font-display text-4xl text-burg transition-colors group-hover:text-ochre-dk">
            {favorites.size}
          </p>
          <p className="font-body text-sm text-soft">{t("favoritesDesc")}</p>
        </Link>

        <Link href="/dashboard/notes" className="group bg-crust p-7 transition-colors hover:bg-crust/70">
          <Eyebrow color="text-soft">{t("notesTitle")}</Eyebrow>
          <p className="mb-1 mt-2 font-display text-4xl text-burg transition-colors group-hover:text-ochre-dk">
            {notesCount ?? "—"}
          </p>
          <p className="font-body text-sm text-soft">{t("notesDesc")}</p>
        </Link>
      </div>

      {/* Профиль */}
      <div className="mt-10 border-t border-rule pt-8">
        <Eyebrow color="text-ochre-dk" className="mb-4">
          {t("profileTitle")}
        </Eyebrow>

        {/* Имя — редактируемое */}
        <div className="mb-5 max-w-sm">
          <label className="mb-1.5 block font-body text-xs text-soft">{t("nameLabel")}</label>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              className="flex-1 rounded-none border border-rule bg-paper px-4 py-2.5 text-sm text-ink outline-none transition focus:border-burg"
            />
            <EditorialButton
              variant="ghost"
              onClick={handleSaveName}
              disabled={savingName || !nameDraft.trim() || nameDraft.trim() === displayName}
              className="px-5 py-2.5 text-[11px]"
            >
              {t("nameSave")}
            </EditorialButton>
          </div>
          {nameSaved && <p className="mt-1.5 font-body text-xs text-olive">{t("nameSaved")}</p>}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="font-body text-sm text-soft">{user.email}</p>
          <EditorialButton variant="ghost" onClick={handleSignOut} className="px-5 py-2.5 text-[11px]">
            {t("signOut")}
          </EditorialButton>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useFavorites } from "@/context/FavoritesContext";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";
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
      <div className="min-h-[40vh] flex items-center justify-center">
        <span className="font-handwritten text-2xl text-charcoal/30">{tc("loading")}</span>
      </div>
    );
  }

  const name = displayName || user.email?.split("@")[0] || "";

  return (
    <main className="px-6 pb-24 max-w-5xl mx-auto">
      <div className="pt-8 pb-10">
        <span className="font-handwritten text-peach text-xl block mb-2">{t("tagline")}</span>
        <h1 className="font-serif text-[clamp(2.2rem,5vw,3.5rem)] leading-none text-charcoal">
          {t(greetingKey(), { name })}
        </h1>
      </div>

      {/* План + кредиты (каркас под монетизацию) */}
      <PlanBanner />

      {/* Карточки разделов */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/dashboard/favorites"
          className="group bg-sand/60 rounded-card p-7 hover:bg-sand transition-colors"
        >
          <span className="text-[11px] uppercase tracking-widest text-charcoal/40">
            {t("favoritesTitle")}
          </span>
          <p className="font-serif text-4xl text-charcoal mt-2 mb-1 group-hover:text-peach transition-colors">
            {favorites.size}
          </p>
          <p className="text-sm text-charcoal/50">{t("favoritesDesc")}</p>
        </Link>

        <Link
          href="/dashboard/notes"
          className="group bg-sand/60 rounded-card p-7 hover:bg-sand transition-colors"
        >
          <span className="text-[11px] uppercase tracking-widest text-charcoal/40">
            {t("notesTitle")}
          </span>
          <p className="font-serif text-4xl text-charcoal mt-2 mb-1 group-hover:text-peach transition-colors">
            {notesCount ?? "—"}
          </p>
          <p className="text-sm text-charcoal/50">{t("notesDesc")}</p>
        </Link>
      </div>

      {/* Профиль */}
      <div className="mt-10 border-t border-sand pt-8">
        <span className="text-[11px] uppercase tracking-widest text-charcoal/40 block mb-4">
          {t("profileTitle")}
        </span>

        {/* Имя — редактируемое */}
        <div className="mb-5 max-w-sm">
          <label className="block text-xs text-charcoal/40 mb-1.5">{t("nameLabel")}</label>
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              className="flex-1 bg-sand rounded-xl px-4 py-2.5 text-sm text-charcoal outline-none focus:ring-2 focus:ring-peach/30 transition"
            />
            <Button
              onClick={handleSaveName}
              loading={savingName}
              disabled={!nameDraft.trim() || nameDraft.trim() === displayName}
              size="sm"
            >
              {t("nameSave")}
            </Button>
          </div>
          {nameSaved && <p className="text-xs text-sage-dark mt-1.5">{t("nameSaved")}</p>}
        </div>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <p className="text-sm text-charcoal/50">{user.email}</p>
          <button
            onClick={handleSignOut}
            className="text-sm text-charcoal/50 hover:text-peach border border-charcoal/15 hover:border-peach/40 rounded-full px-5 py-2.5 transition-colors"
          >
            {t("signOut")}
          </button>
        </div>
      </div>
    </main>
  );
}

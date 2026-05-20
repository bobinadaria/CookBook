"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useFavorites } from "@/context/FavoritesContext";
import { createClient } from "@/lib/supabase/client";
import PlanBanner from "./PlanBanner";

export default function DashboardHomePage() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const { user, favorites } = useFavorites();
  const [notesCount, setNotesCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("user_notes")
      .select("id", { count: "exact", head: true })
      .then(({ count }) => setNotesCount(count ?? 0));
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // middleware гарантирует сессию, но на момент гидрации user может быть null
  if (!user) {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <span className="font-handwritten text-2xl text-charcoal/30">{tc("loading")}</span>
      </div>
    );
  }

  const name = user.email?.split("@")[0] ?? "";

  return (
    <main className="px-6 pb-24 max-w-5xl mx-auto">
      <div className="pt-8 pb-10">
        <span className="font-handwritten text-peach text-xl block mb-2">{t("tagline")}</span>
        <h1 className="font-serif text-[clamp(2.2rem,5vw,3.5rem)] leading-none text-charcoal">
          {t("greeting", { name })}
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
      <div className="mt-10 border-t border-sand pt-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <span className="text-[11px] uppercase tracking-widest text-charcoal/40 block mb-1">
            {t("profileTitle")}
          </span>
          <p className="text-sm text-charcoal/70">{user.email}</p>
        </div>
        <button
          onClick={handleSignOut}
          className="text-sm text-charcoal/50 hover:text-peach border border-charcoal/15 hover:border-peach/40 rounded-full px-5 py-2.5 transition-colors"
        >
          {t("signOut")}
        </button>
      </div>
    </main>
  );
}

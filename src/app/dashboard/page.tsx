"use client";

import { useEffect, useState } from "react";
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

export default function AccountPage() {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const { user } = useFavorites();
  const [displayName, setDisplayName] = useState("");
  const [nameDraft, setNameDraft] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);
  const [plan, setPlan] = useState<"free" | "premium" | "lifetime">("free");

  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("profiles")
      .select("display_name, plan")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const n = data?.display_name ?? user.email?.split("@")[0] ?? "";
        setDisplayName(n);
        setNameDraft(n);
        const p = data?.plan;
        setPlan(p === "premium" || p === "lifetime" ? p : "free");
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
    <main className="mx-auto max-w-[1320px] px-6 pb-24 md:px-10 lg:px-14">
      <div className="pb-8 pt-10">
        <Eyebrow color="text-ochre-dk">{t("tagline")}</Eyebrow>
        <h1 className="mt-3 font-display text-[clamp(2.75rem,6vw,72px)] font-normal leading-[0.92] tracking-[-0.03em] text-burg">
          {t(greetingKey(), { name })}
        </h1>
      </div>

      {/* Две сгруппированные колонки: слева — аккаунт, справа — план.
          На телефоне колонки автоматически встают друг под друга. */}
      <div className="grid grid-cols-1 items-start gap-9 lg:grid-cols-2">
        {/* Аккаунт — данные профиля сгруппированы наверху */}
        <section className="bg-crust p-6 md:p-7">
          <Eyebrow color="text-ochre-dk" className="mb-5">
            {t("profileTitle")}
          </Eyebrow>

          <div className="max-w-md">
            {/* Имя — редактируемое */}
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

            {/* Почта */}
            <div className="mt-6">
              <p className="mb-1.5 font-body text-xs text-soft">{t("emailLabel")}</p>
              <p className="font-body text-sm text-ink">{user.email}</p>
            </div>

            {/* Выход */}
            <div className="mt-6 border-t border-rule pt-5">
              <EditorialButton variant="ghost" onClick={handleSignOut} className="px-5 py-2.5 text-[11px]">
                {t("signOut")}
              </EditorialButton>
            </div>
          </div>
        </section>

        {/* План + подписка (карточка с «View more») */}
        <PlanBanner plan={plan} />
      </div>
    </main>
  );
}

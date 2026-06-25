"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { EditorialButton, Eyebrow } from "@/components/ui";
import PlanBanner from "@/app/dashboard/PlanBanner";

interface Props {
  userId: string;
  email: string;
  initialDisplayName: string;
  plan: "free" | "premium" | "lifetime";
  /** Баланс обложек из credit_ledger. null = монетизация выключена или Free. */
  coverCredits: number | null;
}

/**
 * Клиентский блок профиля: имя, email, тариф, обложки, выход.
 * Все данные передаются с сервера как пропсы — нет лишнего fetch на клиенте.
 */
export default function ProfileBlock({
  userId,
  email,
  initialDisplayName,
  plan,
  coverCredits,
}: Props) {
  const t = useTranslations("dashboard");

  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [nameDraft, setNameDraft] = useState(initialDisplayName);
  const [savingName, setSavingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const handleSaveName = async () => {
    const next = nameDraft.trim();
    if (!next || next === displayName) return;
    setSavingName(true);
    setNameSaved(false);
    const supabase = createClient();
    await supabase.from("profiles").update({ display_name: next }).eq("id", userId);
    setDisplayName(next);
    setSavingName(false);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2500);
  };

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // Показываем блок обложек только paid-планам (Free не может покупать пакеты)
  const showCovers = plan === "premium" || plan === "lifetime";

  return (
    <section>
      <div className="grid grid-cols-1 items-start gap-9 lg:grid-cols-2">
        {/* Данные аккаунта */}
        <div className="bg-crust p-6 md:p-7">
          <div className="max-w-md">
            {/* Имя */}
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
            {nameSaved && (
              <p className="mt-1.5 font-body text-xs text-olive">{t("nameSaved")}</p>
            )}

            {/* Почта */}
            <div className="mt-6">
              <p className="mb-1.5 font-body text-xs text-soft">{t("emailLabel")}</p>
              <p className="font-body text-sm text-ink">{email}</p>
            </div>

            {/* Выход */}
            <div className="mt-6 border-t border-rule pt-5">
              <EditorialButton
                variant="ghost"
                onClick={handleSignOut}
                className="px-5 py-2.5 text-[11px]"
              >
                {t("signOut")}
              </EditorialButton>
            </div>
          </div>
        </div>

        {/* Правая колонка: тариф + (если paid) блок обложек */}
        <div className="flex flex-col gap-6">
          <PlanBanner plan={plan} />

          {showCovers && (
            <CoverCreditsCard credits={coverCredits} t={t} />
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Блок AI-обложек ──────────────────────────────────────────────────────────

function CoverCreditsCard({
  credits,
  t,
}: {
  credits: number | null;
  t: ReturnType<typeof useTranslations<"dashboard">>;
}) {
  // credits === null → монетизация выключена (бета), показываем «без лимита»
  const isUnlimited = credits === null;
  const isEmpty = !isUnlimited && credits === 0;

  return (
    <section className="bg-crust p-6 md:p-7">
      <Eyebrow color="text-ochre-dk" className="mb-5">
        {t("coverCreditsTitle")}
      </Eyebrow>

      {isUnlimited ? (
        /* Бета — монетизация выключена */
        <div>
          <p className="font-display text-3xl leading-none text-burg">∞</p>
          <p className="mt-2 font-body text-sm text-soft">{t("coverCreditsUnlimited")}</p>
        </div>
      ) : isEmpty ? (
        /* Кредиты закончились */
        <div>
          <p className="font-display text-3xl leading-none text-muted">0</p>
          <p className="mt-2 font-body text-sm text-soft">{t("coverCreditsEmpty")}</p>
          <Link
            href="/pricing#covers"
            className="mt-4 inline-block border border-burg px-4 py-2 font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-burg transition-colors hover:bg-burg hover:text-paper"
          >
            {t("coverCreditsBuy")} →
          </Link>
        </div>
      ) : (
        /* Есть кредиты */
        <div>
          <p className="font-display text-[48px] font-normal leading-none text-burg">
            {credits}
          </p>
          <p className="mt-1 font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-soft">
            {t("coverCreditsRemaining")}
          </p>
          <div className="mt-5 border-t border-rule pt-4">
            <Link
              href="/pricing#covers"
              className="font-body text-[12px] font-semibold uppercase tracking-[0.12em] text-burg transition-colors hover:text-ochre-dk"
            >
              {t("coverCreditsBuy")} →
            </Link>
          </div>
        </div>
      )}
    </section>
  );
}

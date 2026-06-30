"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";

export default function WelcomePage() {
  const t = useTranslations("auth.welcome");
  const router = useRouter();
  const [consent, setConsent] = useState(true);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await fetch("/api/auth/complete-welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketing_consent: consent }),
      });
    } catch {
      // best-effort — even on error we move forward
    }
    router.push("/dashboard");
  };

  return (
    <main className="min-h-dvh bg-paper flex flex-col">
      {/* Top bar */}
      <div className="px-8 py-6">
        <Link
          href="/"
          className="font-display italic text-2xl text-ink hover:text-ochre-dk transition-colors"
        >
          The Slow Table
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm hero-in-1">
          {/* Header */}
          <div className="mb-10">
            <span className="font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-ochre-dk block mb-3">
              {t("tagline")}
            </span>
            <h1 className="font-display text-[2.8rem] leading-tight text-ink mb-3">
              {t("title")}
            </h1>
            <p className="text-soft text-sm leading-relaxed">{t("subtitle")}</p>
          </div>

          <div className="w-12 h-px bg-crust mb-8" />

          {/* Consent toggle */}
          <label className="flex items-start gap-3 cursor-pointer mb-8">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-0.5 shrink-0 accent-burg"
            />
            <span className="text-[13px] text-ink leading-relaxed">
              {t("consentLabel")}
            </span>
          </label>

          <Button
            type="button"
            variant="primary"
            size="lg"
            fullWidth
            loading={loading}
            onClick={handleSubmit}
          >
            {loading ? t("loading") : t("cta")}
          </Button>
        </div>
      </div>
    </main>
  );
}

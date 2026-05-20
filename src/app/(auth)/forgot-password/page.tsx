"use client";

import { useState, FormEvent, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";

type Step = "form" | "success";

function ForgotPasswordContent() {
  const t = useTranslations("auth.forgotPassword");
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("form");

  // Prefill email из ?email= (приходит с register или login)
  useEffect(() => {
    const queryEmail = searchParams.get("email");
    if (queryEmail) setEmail(queryEmail);
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    if (error) {
      setError(t("errorGeneric"));
      setLoading(false);
    } else {
      setStep("success");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-dvh bg-paper flex flex-col">
      {/* Top bar */}
      <div className="px-8 py-6 flex items-center justify-between">
        <Link
          href="/"
          className="font-display italic text-2xl text-ink hover:text-ochre-dk transition-colors"
        >
          CookBook
        </Link>
        <Link href="/login" className="text-sm text-soft hover:text-ochre-dk transition-colors">
          {t("backLink")}
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        {step === "success" ? (
          /* ── Success state ── */
          <div className="w-full max-w-sm text-center hero-in-1">
            <span className="font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-ochre-dk block mb-4">
              {t("successTagline")}
            </span>
            <h1 className="font-display text-[2.8rem] leading-tight text-ink mb-6">
              {t("successTitle")}
            </h1>
            <p className="text-soft text-sm leading-relaxed mb-10">
              {t("successText", { email })}
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-ochre-dk hover:underline"
            >
              {t("successLink")}
            </Link>
          </div>
        ) : (
          /* ── Form state ── */
          <div className="w-full max-w-sm">
            {/* Header */}
            <div className="hero-in-1 mb-10">
              <span className="font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-ochre-dk block mb-3">
                {t("tagline")}
              </span>
              <h1 className="font-display text-[2.8rem] leading-tight text-ink">
                {t("title")}
              </h1>
            </div>

            {/* Divider */}
            <div className="hero-in-2 w-12 h-px bg-crust mb-6" />

            <p className="hero-in-2 text-sm text-soft mb-8">
              {t("description")}
            </p>

            {/* Form */}
            <form onSubmit={handleSubmit} className="hero-in-3 space-y-5">
              <div>
                <label className="block text-xs text-soft uppercase tracking-wider mb-2">
                  {t("email")}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="your@email.com"
                  className="w-full bg-crust rounded-none px-4 py-3.5 text-sm text-ink placeholder:text-muted outline-none focus:ring-2 focus:ring-burg/30 transition"
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-50 rounded-none px-4 py-3">
                  {error}
                </p>
              )}

              <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} className="mt-2">
                {loading ? t("loading") : t("submit")}
              </Button>
            </form>

            {/* Footer */}
            <p className="hero-in-4 mt-10 text-center text-sm text-muted">
              <Link href="/login" className="text-ochre-dk hover:underline">
                {t("backLink")}
              </Link>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense>
      <ForgotPasswordContent />
    </Suspense>
  );
}

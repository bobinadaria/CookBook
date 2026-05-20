"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui";

type Step = "form" | "success";

export default function ResetPasswordPage() {
  const t = useTranslations("auth.resetPassword");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("form");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError(t("errorMismatch"));
      return;
    }
    if (password.length < 6) {
      setError(t("errorShort"));
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

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
              {t("successText")}
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
            <div className="hero-in-2 w-12 h-px bg-crust mb-10" />

            {/* Form */}
            <form onSubmit={handleSubmit} className="hero-in-3 space-y-5">
              <div>
                <label className="block text-xs text-soft uppercase tracking-wider mb-2">
                  {t("password")}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder={t("passwordHint")}
                  className="w-full bg-crust rounded-none px-4 py-3.5 text-sm text-ink placeholder:text-muted outline-none focus:ring-2 focus:ring-burg/30 transition"
                />
              </div>

              <div>
                <label className="block text-xs text-soft uppercase tracking-wider mb-2">
                  {t("confirmPassword")}
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
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
          </div>
        )}
      </div>
    </main>
  );
}

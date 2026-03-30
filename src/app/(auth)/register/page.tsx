"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

type Step = "form" | "success";

export default function RegisterPage() {
  const t = useTranslations("auth.register");
  const [email, setEmail] = useState("");
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
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(
        error.message.includes("already registered")
          ? t("errorExists")
          : t("errorGeneric")
      );
      setLoading(false);
    } else {
      setStep("success");
    }
  };

  return (
    <main className="min-h-screen bg-cream flex flex-col">
      {/* Top bar */}
      <div className="px-8 py-6 flex items-center justify-between">
        <Link
          href="/"
          className="font-handwritten text-2xl text-charcoal hover:text-peach transition-colors"
        >
          CookBook
        </Link>
        <Link href="/login" className="text-sm text-charcoal/40 hover:text-peach transition-colors">
          {t("backLink")}
        </Link>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12">
        {step === "success" ? (
          /* ── Success state ── */
          <div className="w-full max-w-sm text-center hero-in-1">
            <span className="font-handwritten text-peach text-xl block mb-4">
              {t("successTagline")}
            </span>
            <h1 className="font-serif text-[2.8rem] leading-tight text-charcoal mb-6">
              {t("successTitle")}
            </h1>
            <p className="text-charcoal/50 text-sm leading-relaxed mb-10">
              {t("successText", { email })}
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm text-peach hover:underline"
            >
              {t("successLink")}
            </Link>
          </div>
        ) : (
          /* ── Form state ── */
          <div className="w-full max-w-sm">

            {/* Header */}
            <div className="hero-in-1 mb-10">
              <span className="font-handwritten text-peach text-xl block mb-3">
                {t("tagline")}
              </span>
              <h1 className="font-serif text-[2.8rem] leading-tight text-charcoal">
                {t("title")}
              </h1>
            </div>

            {/* Divider */}
            <div className="hero-in-2 w-12 h-px bg-sand mb-10" />

            {/* Form */}
            <form onSubmit={handleSubmit} className="hero-in-3 space-y-5">
              <div>
                <label className="block text-xs text-charcoal/40 uppercase tracking-wider mb-2">
                  {t("email")}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="your@email.com"
                  className="w-full bg-sand rounded-xl px-4 py-3.5 text-sm text-charcoal placeholder:text-charcoal/25 outline-none focus:ring-2 focus:ring-peach/30 transition"
                />
              </div>

              <div>
                <label className="block text-xs text-charcoal/40 uppercase tracking-wider mb-2">
                  {t("password")}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder={t("passwordHint")}
                  className="w-full bg-sand rounded-xl px-4 py-3.5 text-sm text-charcoal placeholder:text-charcoal/25 outline-none focus:ring-2 focus:ring-peach/30 transition"
                />
              </div>

              <div>
                <label className="block text-xs text-charcoal/40 uppercase tracking-wider mb-2">
                  {t("confirmPassword")}
                </label>
                <input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full bg-sand rounded-xl px-4 py-3.5 text-sm text-charcoal placeholder:text-charcoal/25 outline-none focus:ring-2 focus:ring-peach/30 transition"
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-50 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-charcoal text-cream rounded-full py-4 text-sm font-medium hover:bg-peach transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {loading ? t("loading") : t("submit")}
              </button>
            </form>

            {/* Footer */}
            <p className="hero-in-4 mt-10 text-center text-sm text-charcoal/35">
              {t("hasAccount")}{" "}
              <Link href="/login" className="text-peach hover:underline">
                {t("loginLink")}
              </Link>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

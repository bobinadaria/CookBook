"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import AuthDivider from "@/components/auth/AuthDivider";
import { Button } from "@/components/ui";
import { SOCIAL_LINKS } from "@/lib/social-links";

type Step = "form" | "success";
type ErrorState =
  | { kind: "message"; text: string }
  | { kind: "exists"; email: string }
  | null;

export default function RegisterPage() {
  const t = useTranslations("auth.register");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ErrorState>(null);
  const [step, setStep] = useState<Step>("form");
  const [marketingConsent, setMarketingConsent] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError({ kind: "message", text: t("errorMismatch") });
      return;
    }
    if (password.length < 6) {
      setError({ kind: "message", text: t("errorShort") });
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      // Имя уходит в метаданные → триггер handle_new_user кладёт его в profiles.display_name.
      options: {
        data: {
          ...(name.trim() ? { display_name: name.trim() } : {}),
          marketing_consent: marketingConsent,
        },
      },
    });

    // Supabase quirk: при попытке регистрации существующего email НЕ возвращает error
    // (anti-enumeration protection). Признак — data.user.identities — пустой массив.
    // Без этой проверки юзер видит «Проверьте почту», письмо не приходит, аккаунт не создаётся.
    const isExistingEmail =
      !signUpError && data.user && (data.user.identities?.length ?? 0) === 0;

    if (signUpError) {
      setError({ kind: "message", text: t("errorGeneric") });
      setLoading(false);
    } else if (isExistingEmail) {
      setError({ kind: "exists", email });
      setLoading(false);
    } else {
      setStep("success");
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
          The Slow Table
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
            <p className="text-soft text-sm leading-relaxed mb-8">
              {t("successText", { email })}
            </p>

            {/* Соцсети */}
            <div className="mb-8 border-t border-rule pt-8">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-soft mb-1">
                {t("successFollowTitle")}
              </p>
              <p className="text-sm text-soft mb-5">{t("successFollowText")}</p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href={SOCIAL_LINKS.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 border border-burg text-burg text-sm font-medium px-5 py-2.5 hover:bg-burg hover:text-paper transition-colors"
                >
                  {t("successFollowInstagram")}
                </a>
                <a
                  href={SOCIAL_LINKS.telegram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 border border-burg text-burg text-sm font-medium px-5 py-2.5 hover:bg-burg hover:text-paper transition-colors"
                >
                  {t("successFollowTelegram")}
                </a>
              </div>
            </div>

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
            <div className="hero-in-2 w-12 h-px bg-crust mb-8" />

            <div className="hero-in-3">
              {/* Google OAuth */}
              <GoogleAuthButton redirectTo="/" />

              <AuthDivider />

              {/* Email form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs text-soft uppercase tracking-wider mb-2">
                    {t("name")}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="given-name"
                    placeholder={t("namePlaceholder")}
                    className="w-full bg-crust rounded-none px-4 py-3.5 text-sm text-ink placeholder:text-muted outline-none focus:ring-2 focus:ring-burg/30 transition"
                  />
                </div>

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

                {error?.kind === "message" && (
                  <p className="text-sm text-red-400 bg-red-50 rounded-none px-4 py-3">
                    {error.text}
                  </p>
                )}

                {error?.kind === "exists" && (
                  <div className="bg-ochre/10 border border-ochre/30 rounded-none px-4 py-4 space-y-3">
                    <p className="text-sm text-ink">{t("errorExistsAction")}</p>
                    <div className="flex flex-wrap gap-3">
                      <Link
                        href={`/login?email=${encodeURIComponent(error.email)}`}
                        className="inline-flex items-center gap-1 text-sm font-medium text-ochre-dk hover:text-ochre-dk transition-colors"
                      >
                        {t("errorExistsLoginCTA")}
                        <span aria-hidden>→</span>
                      </Link>
                      <span className="text-muted">·</span>
                      <Link
                        href={`/forgot-password?email=${encodeURIComponent(error.email)}`}
                        className="text-sm text-soft hover:text-ochre-dk transition-colors"
                      >
                        {t("errorExistsForgotCTA")}
                      </Link>
                    </div>
                  </div>
                )}

                {/* Маркетинговое согласие (GDPR opt-in) */}
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={marketingConsent}
                    onChange={(e) => setMarketingConsent(e.target.checked)}
                    className="mt-0.5 shrink-0 accent-burg"
                  />
                  <span className="text-[11px] text-soft leading-relaxed">
                    {t("marketingConsent")}
                  </span>
                </label>

                <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} className="mt-2">
                  {loading ? t("loading") : t("submit")}
                </Button>

                <p className="mt-4 text-center text-[11px] text-muted leading-relaxed">
                  Регистрируясь, вы соглашаетесь с{" "}
                  <Link href="/terms" className="underline hover:text-soft transition-colors">
                    Условиями использования
                  </Link>{" "}
                  и{" "}
                  <Link href="/privacy" className="underline hover:text-soft transition-colors">
                    Политикой конфиденциальности
                  </Link>
                  .
                </p>
              </form>
            </div>

            {/* Footer */}
            <p className="hero-in-4 mt-10 text-center text-sm text-muted">
              {t("hasAccount")}{" "}
              <Link href="/login" className="text-ochre-dk hover:underline">
                {t("loginLink")}
              </Link>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

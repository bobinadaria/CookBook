"use client";

import { useState, FormEvent, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import GoogleAuthButton from "@/components/auth/GoogleAuthButton";
import AuthDivider from "@/components/auth/AuthDivider";
import { Button } from "@/components/ui";

function LoginContent() {
  const t = useTranslations("auth.login");
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill email из ?email= (приходит с register или forgot-password)
  useEffect(() => {
    const queryEmail = searchParams.get("email");
    if (queryEmail) setEmail(queryEmail);
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.target as HTMLFormElement;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(t("error"));
      setLoading(false);
    } else {
      // Full navigation so Chrome detects successful login and offers to save password
      window.location.href = "/";
    }
  };

  return (
    <main className="min-h-dvh bg-cream flex flex-col">
      {/* Top bar */}
      <div className="px-8 py-6 flex items-center justify-between">
        <Link
          href="/"
          className="font-handwritten text-2xl text-charcoal hover:text-peach transition-colors"
        >
          CookBook
        </Link>
        <Link href="/register" className="text-sm text-charcoal/40 hover:text-peach transition-colors">
          {t("backLink")}
        </Link>
      </div>

      {/* Form area */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
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
          <div className="hero-in-2 w-12 h-px bg-sand mb-8" />

          <div className="hero-in-3">
            {/* Google OAuth */}
            <GoogleAuthButton redirectTo="/" />

            <AuthDivider />

            {/* Email form */}
            <form onSubmit={handleSubmit} method="post" action="/login" className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-xs text-charcoal/40 uppercase tracking-wider mb-2">
                  {t("email")}
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="username"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-sand rounded-xl px-4 py-3.5 text-sm text-charcoal placeholder:text-charcoal/25 outline-none focus:ring-2 focus:ring-peach/30 transition autofill:bg-sand autofill:shadow-[inset_0_0_0px_1000px_#F2E8DC]"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs text-charcoal/40 uppercase tracking-wider mb-2">
                  {t("password")}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full bg-sand rounded-xl px-4 py-3.5 text-sm text-charcoal placeholder:text-charcoal/25 outline-none focus:ring-2 focus:ring-peach/30 transition autofill:bg-sand autofill:shadow-[inset_0_0_0px_1000px_#F2E8DC]"
                />
              </div>

              {error && (
                <p className="text-sm text-red-400 bg-red-50 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}

              <div className="flex justify-end">
                <Link
                  href={`/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`}
                  className="text-xs text-charcoal/35 hover:text-peach transition-colors"
                >
                  {t("forgotPassword")}
                </Link>
              </div>

              <Button type="submit" variant="primary" size="lg" fullWidth loading={loading} className="mt-2">
                {loading ? t("loading") : t("submit")}
              </Button>
            </form>
          </div>

          {/* Footer */}
          <p className="hero-in-4 mt-10 text-center text-sm text-charcoal/35">
            {t("noAccount")}{" "}
            <Link href="/register" className="text-peach hover:underline">
              {t("registerLink")}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

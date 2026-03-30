"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const t = useTranslations("auth.login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(t("error"));
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
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
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full bg-sand rounded-xl px-4 py-3.5 text-sm text-charcoal placeholder:text-charcoal/25 outline-none focus:ring-2 focus:ring-peach/30 transition"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 bg-red-50 rounded-xl px-4 py-3">
                {error}
              </p>
            )}

            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                className="text-xs text-charcoal/35 hover:text-peach transition-colors"
              >
                {t("forgotPassword")}
              </Link>
            </div>

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

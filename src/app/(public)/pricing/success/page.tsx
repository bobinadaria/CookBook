/**
 * /pricing/success — страница после успешной оплаты в Stripe.
 * Показывает разный текст в зависимости от плана (?plan=premium|lifetime|pack&size=S|M|L).
 * Полностью двуязычная через next-intl.
 */
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Eyebrow } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import SuccessPlanActions from "./SuccessPlanActions";

export const metadata: Metadata = {
  title: "Payment successful — The Slow Table",
  robots: { index: false },
};

interface Props {
  searchParams: Promise<{ plan?: string; size?: string }>;
}

export default async function PricingSuccessPage({ searchParams }: Props) {
  const { plan, size } = await searchParams;
  const t = await getTranslations("pricing.success");

  // Нужен для SuccessPlanActions — определяем aiEnabled по текущему плану
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let aiEnabled = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", user.id)
      .single();
    const p = profile?.plan;
    aiEnabled = p === "premium" || p === "lifetime";
  }

  // Определяем заголовок и акцент по плану
  let title: string;
  let accent: string;

  if (plan === "lifetime") {
    title  = t("lifetime.title");
    accent = t("lifetime.accent");
  } else if (plan === "pack") {
    title  = t("pack.title");
    accent = size === "S" ? t("pack.accentS") : size === "M" ? t("pack.accentM") : t("pack.accentL");
  } else {
    // premium (default)
    title  = t("premium.title");
    accent = t("premium.accent");
  }

  const body = plan === "lifetime"
    ? t("lifetime.body")
    : plan === "pack"
      ? t("pack.body")
      : t("premium.body");

  return (
    <div className="bg-paper text-ink">
      <section className="mx-auto flex min-h-[60vh] max-w-[760px] flex-col items-center justify-center px-6 py-24 text-center md:px-10">
        <span className="mb-6 font-body text-[40px] leading-none">✓</span>

        <Eyebrow color="text-ochre-dk">{t("eyebrow")}</Eyebrow>

        <h1 className="mt-4 font-display text-[clamp(2.5rem,7vw,72px)] font-normal leading-[0.92] tracking-[-0.03em] text-burg">
          {title}
          <br />
          <em className="italic text-ochre">{accent}</em>
        </h1>

        <p className="mt-6 max-w-[480px] font-reader text-[15px] leading-[1.75] text-soft">
          {body}
        </p>

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
          {plan === "pack" ? (
            /* Пакет обложек → кабинет + каталог */
            <>
              <Link
                href="/dashboard"
                className="border-[1.5px] border-ochre bg-ochre px-8 py-4 font-body text-[12px] font-semibold uppercase tracking-[0.15em] text-seal transition-colors hover:bg-ochre-dk"
              >
                {t("ctaDashboard")}
              </Link>
              <Link
                href="/recipes"
                className="border-[1.5px] border-burg/50 px-8 py-4 font-body text-[12px] font-semibold uppercase tracking-[0.15em] text-burg transition-colors hover:bg-burg hover:text-paper"
              >
                {t("ctaRecipes")}
              </Link>
            </>
          ) : (
            /* Premium / Lifetime → модалка создания рецепта + купить пакеты */
            <SuccessPlanActions aiEnabled={aiEnabled} />
          )}
        </div>
      </section>
    </div>
  );
}

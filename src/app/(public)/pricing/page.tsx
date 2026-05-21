import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Eyebrow, EditorialButton, PullQuote } from "@/components/ui";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("pricing");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: "/pricing" },
  };
}

type FeatureValue = boolean | string;

interface Tier {
  key: "free" | "premium" | "lifetime";
  chapterLabel: string;
  numeral: string;
  price: string;
  cadence: string;
  lede: string;
  features: [string, FeatureValue][];
  cta: string;
  noteTop: string;
  noteBottom: string;
}

/** Visual styling per tier (presentation only — not localized). */
const TIER_STYLE: Record<string, { dark: boolean; bg: string; ctaVariant: "ghost" | "solid" | "ochre" }> = {
  free: { dark: false, bg: "bg-paper", ctaVariant: "ghost" },
  premium: { dark: true, bg: "bg-section", ctaVariant: "solid" },
  lifetime: { dark: false, bg: "bg-crust", ctaVariant: "ochre" },
};

function FeatureMark({ value, dark }: { value: FeatureValue; dark: boolean }) {
  if (value === true) return <span className="text-olive">●</span>;
  if (value === false) return <span className={dark ? "text-section-fg/35" : "text-muted"}>○</span>;
  return (
    <span
      className={cn(
        "font-body text-[11px] font-semibold uppercase tracking-[0.13em]",
        dark ? "text-ochre" : "text-ochre-dk",
      )}
    >
      {value}
    </span>
  );
}

export default async function PricingPage() {
  const t = await getTranslations("pricing");
  const tiers = t.raw("tiers") as Tier[];
  const headerFacts = t.raw("headerFacts") as string[];
  const packs = t.raw("packs") as [string, string, string][];
  const faq = t.raw("faq") as [string, string][];

  return (
    <div className="bg-paper text-ink">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1320px] px-6 pb-14 pt-16 md:px-10 lg:px-14 lg:pt-[72px]">
        <div className="grid items-end gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
          <div>
            <Eyebrow color="text-ochre-dk">{t("headerEyebrow")}</Eyebrow>
            <h1 className="mt-3.5 font-display text-[clamp(3rem,8vw,120px)] font-normal leading-[0.9] tracking-[-0.03em] text-burg">
              {t("title1")}
              <br />
              <em className="italic text-ochre">{t("titleAccent")}</em>
            </h1>
          </div>
          <div>
            <p className="font-body text-[16px] leading-[1.75] text-ink">{t("headerLede")}</p>
            <div className="mt-6 flex flex-wrap justify-between gap-x-6 gap-y-2 border-t-2 border-burg pt-5 font-body text-[11px] font-semibold uppercase tracking-[0.13em] text-soft">
              {headerFacts.map((f) => (
                <span key={f}>
                  <span className="text-olive">●</span> {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 tiers ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1320px] px-6 pb-20 md:px-10 lg:px-14">
        <div className="grid grid-cols-1 lg:grid-cols-3">
          {tiers.map((tier, i) => {
            const style = TIER_STYLE[tier.key];
            return (
              <div
                key={tier.key}
                className={cn(
                  "relative flex flex-col px-8 py-10",
                  style.bg,
                  style.dark ? "text-section-fg" : "text-ink",
                  i < tiers.length - 1 && "border-b border-rule lg:border-b-0 lg:border-r",
                )}
              >
                {tier.noteTop && (
                  <div className="absolute inset-x-0 top-0 bg-ochre px-4 py-2 text-center font-body text-[10px] font-bold uppercase tracking-[0.16em] text-seal">
                    {tier.noteTop}
                  </div>
                )}

                <div className={tier.noteTop ? "mt-6" : ""}>
                  <div className="flex items-baseline gap-3.5">
                    <span className="font-display text-[44px] font-normal italic leading-[0.9] text-ochre sm:text-[48px]">
                      {tier.numeral}
                    </span>
                    <Eyebrow color={style.dark ? "text-ochre" : "text-ochre-dk"}>{tier.chapterLabel}</Eyebrow>
                  </div>

                  <div className="mt-5 font-display text-[72px] font-normal leading-[0.9] tracking-[-0.03em] sm:text-[88px]">
                    {tier.price}
                  </div>
                  <div
                    className={cn(
                      "mt-1.5 font-body text-[11px] font-semibold uppercase tracking-[0.16em]",
                      style.dark ? "text-section-fg/70" : "text-soft",
                    )}
                  >
                    {tier.cadence}
                  </div>

                  <p
                    className={cn(
                      "mt-4 font-reader text-[14px] italic leading-[1.7]",
                      style.dark ? "text-section-fg/85" : "text-ink",
                    )}
                  >
                    {tier.lede}
                  </p>
                </div>

                {/* Features */}
                <div className={cn("mt-7 border-t", style.dark ? "border-section-rule" : "border-rule")}>
                  {tier.features.map(([name, value], idx) => (
                    <div
                      key={idx}
                      className={cn(
                        "grid grid-cols-[1fr_auto] items-baseline gap-3 border-b py-2.5 text-[13px]",
                        style.dark ? "border-section-rule text-section-fg/88" : "border-rule text-ink",
                      )}
                    >
                      <span
                        className={cn(
                          value === false && "line-through",
                          value === false && (style.dark ? "text-section-fg/40" : "text-muted"),
                        )}
                      >
                        {name}
                      </span>
                      <FeatureMark value={value} dark={style.dark} />
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <div className="mt-auto pt-7">
                  <EditorialButton variant={style.ctaVariant} href="/register" className="w-full px-5 py-4">
                    {tier.cta}
                  </EditorialButton>
                  {tier.noteBottom && (
                    <div
                      className={cn(
                        "mt-3 text-center font-body text-[10px] font-semibold uppercase tracking-[0.16em]",
                        style.dark ? "text-section-fg/60" : "text-soft",
                      )}
                    >
                      {tier.noteBottom}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── AI-картинки кредитами ───────────────────────────────────────── */}
      <section className="mx-auto max-w-[1320px] px-6 pb-20 md:px-10 lg:px-14">
        <div className="border-l-[6px] border-ochre bg-crust px-6 py-12 md:px-12">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_2fr] lg:gap-12">
            <div>
              <Eyebrow color="text-ochre-dk">{t("aiEyebrow")}</Eyebrow>
              <h2 className="mt-3 font-display text-[40px] font-normal italic leading-[0.95] tracking-[-0.01em] text-burg sm:text-[52px]">
                {t("aiTitle1")}
                <br />
                {t("aiTitle2")}
              </h2>
              <p className="mt-3.5 max-w-[360px] font-body text-[14px] leading-[1.7] text-soft">{t("aiLede")}</p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {packs.map(([size, price, desc]) => (
                <div key={size} className="border border-rule bg-paper px-6 py-6">
                  <div className="flex items-baseline justify-between">
                    <span className="font-display text-[40px] italic leading-none text-ochre">{size}</span>
                    <span className="font-body text-[10px] font-semibold uppercase tracking-[0.14em] text-soft">
                      {t("packLabel")}
                    </span>
                  </div>
                  <div className="mt-3.5 font-display text-[32px] leading-none tracking-[-0.01em] text-burg">
                    {price}
                  </div>
                  <div className="mt-1.5 font-body text-[12px] text-soft">{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Testimonial ─────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1320px] px-6 md:px-10 lg:px-14">
        <PullQuote author={t("testimonialAuthor")}>{t("testimonialQuote")}</PullQuote>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1320px] px-6 py-16 md:px-10 lg:px-14">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_2fr] lg:gap-14">
          <div>
            <Eyebrow color="text-ochre-dk">{t("faqEyebrow")}</Eyebrow>
            <h2 className="mt-3.5 font-display text-[44px] font-normal leading-[0.95] tracking-[-0.02em] text-burg sm:text-[64px] lg:text-[72px]">
              {t("faqTitle1")}
              <br />
              {t("faqTitle2")}
              <br />
              <em className="italic text-ochre">{t("faqTitleAccent")}</em>
            </h2>
          </div>
          <div>
            {faq.map(([q, a], i) => (
              <details key={i} className="group border-t border-rule py-5">
                <summary className="flex cursor-pointer items-baseline justify-between gap-6">
                  <span className="font-display text-[20px] font-normal italic text-burg sm:text-[22px]">{q}</span>
                  <span className="shrink-0 font-body text-[11px] font-bold uppercase tracking-[0.13em] text-ochre-dk">
                    <span className="group-open:hidden">{t("faqOpen")}</span>
                    <span className="hidden group-open:inline">{t("faqClose")}</span>
                  </span>
                </summary>
                <p className="mt-3.5 max-w-[640px] font-reader text-[14px] leading-[1.75] text-soft">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1320px] px-6 pb-20 md:px-10 lg:px-14">
        <div className="grid items-center gap-10 bg-section px-6 py-14 text-section-fg md:px-14 lg:grid-cols-[2fr_1fr] lg:gap-12">
          <div>
            <Eyebrow color="text-ochre">{t("finalEyebrow")}</Eyebrow>
            <h2 className="mb-4 mt-3.5 font-display text-[48px] font-normal leading-[0.92] tracking-[-0.03em] text-section-fg sm:text-[64px] lg:text-[80px]">
              {t("finalTitle1")}
              <br />
              <em className="italic text-ochre">{t("finalTitleAccent")}</em>
            </h2>
            <p className="max-w-[480px] font-body text-[16px] leading-[1.7] text-section-soft">{t("finalLede")}</p>
          </div>
          <div className="flex flex-col gap-3">
            <EditorialButton variant="ochre" href="/register" className="w-full">
              {t("finalCtaPremium")}
            </EditorialButton>
            <EditorialButton
              variant="paper"
              href="/register"
              className="w-full bg-section-fg text-section hover:bg-section-fg/85"
            >
              {t("finalCtaLifetime")}
            </EditorialButton>
            <EditorialButton
              variant="ghost"
              href="/recipes"
              className="w-full border-0 text-section-fg/70 hover:bg-transparent hover:text-section-fg"
            >
              {t("finalCtaFree")}
            </EditorialButton>
          </div>
        </div>
      </section>
    </div>
  );
}

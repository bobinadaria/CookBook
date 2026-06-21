import Image from "next/image";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import RecipeCard from "@/components/recipe/RecipeCard";
import RevealCard from "@/components/animations/RevealCard";
import HomeMagicDemo from "@/components/home/HomeMagicDemo";
import { DropCap, Eyebrow, EditorialButton, PullQuote } from "@/components/ui";
import { fetchFeaturedRecipes } from "@/lib/supabase/server-queries";
import type { LocaleCode } from "@/types";

const HERO_PHOTO = "/hero.png";

export default async function HomePage() {
  const [featured, rawLocale, t] = await Promise.all([
    fetchFeaturedRecipes(),
    getLocale(),
    getTranslations("home"),
  ]);
  const locale = rawLocale as LocaleCode;

  const heroFacts = t.raw("heroFacts") as { v: string; l: string }[];
  const stats = t.raw("stats") as { n: string; t: string }[];
  const editorP1 = t("editorP1");

  return (
    <div className="bg-paper text-ink">
      {/* ── Hero spread ───────────────────────────────────────────────────── */}
      <section className="flex flex-col-reverse border-b border-rule lg:grid lg:grid-cols-[1fr_1.1fr] lg:min-h-[760px]">
        {/* Left — headline + lede + meta */}
        <div className="flex flex-col justify-between gap-8 px-6 py-10 md:px-10 lg:gap-10 lg:px-14 lg:py-16">
          <div>
            <h1 className="font-display text-[clamp(2.5rem,9vw,120px)] font-normal leading-[0.9] tracking-[-0.03em] text-burg lg:leading-[0.88]">
              {t("heroTitle1")}
              <br />
              <em className="italic text-ochre">{t("heroTitle2")}</em>
            </h1>
            <p className="mt-7 max-w-[520px] font-reader text-[19px] leading-[1.6] text-ink">
              {t.rich("heroDescriptor", {
                usda: (chunks) => (
                  <Link href="/pricing#faq-usda" className="underline underline-offset-2 hover:text-burg">
                    {chunks}
                  </Link>
                ),
              })}
            </p>
          </div>

          <div>
            <div className="mb-6 flex flex-wrap items-center gap-4">
              <EditorialButton href="/register">{t("heroCtaCreate")}</EditorialButton>
              <EditorialButton href="/recipes" variant="ghost">
                {t("heroCtaOpen")}
              </EditorialButton>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-3 border-t border-rule pt-5 font-body text-[11px] font-semibold uppercase tracking-[0.13em] text-soft">
              {heroFacts.map((f) => (
                <span key={f.v}>
                  <b className="font-display text-[14px] italic text-burg">{f.v}</b> &nbsp;{f.l}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right — full-bleed photo + magazine plate + caption */}
        <div className="relative aspect-[16/10] bg-crust sm:aspect-[4/3] lg:aspect-auto lg:min-h-[760px]">
          <Image
            src={HERO_PHOTO}
            alt={t("heroAlt")}
            fill
            priority
            className="object-cover object-[center_40%]"
            sizes="(max-width: 1024px) 100vw, 55vw"
          />
          <div className="absolute left-7 top-7 flex flex-col bg-ochre px-4 py-3">
            <span className="font-display text-[34px] italic leading-[0.95] text-seal">{t("heroPlateNo")}</span>
            <span className="mt-1 font-body text-[9px] font-bold uppercase tracking-[0.18em] text-seal">
              {t("heroPlateLabel")}
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-8 pb-7 pt-24 text-section-fg">
            <Eyebrow color="text-section-fg/85">{t("heroCaptionEyebrow")}</Eyebrow>
            <div className="mt-2 font-display text-[26px] italic leading-[1.15] text-section-fg sm:text-[30px]">
              {t("heroCaptionTitle")}
            </div>
            <div className="mt-2 font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-section-fg/75">
              {t("heroCaptionMeta")}
            </div>
          </div>
        </div>
      </section>

      {/* ── Демо: от заметки к странице книги ─────────────────────────────── */}
      <HomeMagicDemo />

      {/* ── Колонка редактора ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1320px] px-6 pb-10 pt-12 md:px-10 md:pb-14 md:pt-20 lg:px-14 lg:pt-[88px]">
        <div className="grid items-start gap-10 lg:grid-cols-[280px_1fr] lg:gap-14">
          <div>
            <Eyebrow color="text-ochre-dk">{t("editorEyebrow")}</Eyebrow>
            <h2 className="mt-3.5 font-display text-[40px] font-normal leading-[0.95] tracking-[-0.02em] text-burg sm:text-[56px]">
              {t("editorTitle1")}
              <br />
              <em className="italic">{t("editorTitle2")}</em>
            </h2>
            <div className="mt-5 font-body text-[12px] font-medium leading-[1.7] text-soft">
              {t("editorMetaIssue")}
              <br />
              {t("editorMetaDate")}
              <br />
              <span className="font-bold text-ochre-dk">{t("editorMetaRead")}</span>
            </div>
          </div>

          <div className="max-w-[720px] font-reader text-[17px] leading-[1.7] text-ink lg:leading-[1.85]">
            <p>
              <DropCap>{editorP1.charAt(0)}</DropCap>
              {editorP1.slice(1)}
            </p>
            <p className="mt-5">{t("editorP2")}</p>
            <p className="mt-5 italic text-soft">{t("editorSign")}</p>
          </div>
        </div>
      </section>

      {/* ── Pull quote ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1320px] px-6 md:px-10 lg:px-14">
        <PullQuote author={t("pullQuoteAuthor")}>{t("pullQuote")}</PullQuote>
      </section>

      {/* ── Содержание выпуска ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1320px] px-6 py-12 md:px-10 md:py-16 lg:px-14">
        <div className="mb-9 flex items-end justify-between gap-6">
          <div>
            <Eyebrow color="text-ochre-dk">{t("tocEyebrow")}</Eyebrow>
            <h2 className="mt-3 font-display text-[40px] font-normal leading-[0.95] tracking-[-0.02em] text-burg sm:text-[64px] lg:text-[72px]">
              {t("tocTitleLead")} <em className="italic text-ochre">{t("tocTitleAccent")}</em>
            </h2>
          </div>
          <Link
            href="/recipes"
            className="hidden whitespace-nowrap font-body text-[12px] font-semibold uppercase tracking-[0.16em] text-burg transition-colors hover:text-ochre-dk sm:block"
          >
            {t("tocAll")}
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="flex flex-col items-center justify-center border-t border-rule py-20 text-center">
            <p className="font-display text-[28px] italic text-burg/40">{t("emptyTitle")}</p>
            <p className="mt-3 max-w-sm font-body text-sm text-soft">{t("emptySubtitle")}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-9 sm:gap-y-12 lg:grid-cols-3">
            {featured.map((recipe, i) => (
              <RevealCard key={recipe.id} index={i}>
                <RecipeCard recipe={recipe} locale={locale} index={i + 1} />
              </RevealCard>
            ))}
          </div>
        )}

        <div className="mt-12 flex justify-center sm:hidden">
          <EditorialButton href="/recipes" variant="ghost">
            {t("tocAll")}
          </EditorialButton>
        </div>
      </section>

      {/* ── Кухня в цифрах ────────────────────────────────────────────────── */}
      <section className="mt-10 bg-section px-6 py-14 text-section-fg md:mt-14 md:px-10 md:py-[72px] lg:px-14">
        <div className="mx-auto grid max-w-[1320px] items-center gap-12 lg:grid-cols-[1fr_2fr] lg:gap-14">
          <div>
            <Eyebrow color="text-ochre">{t("statsEyebrow")}</Eyebrow>
            <h2 className="mt-3 font-display text-[36px] font-normal italic leading-[0.95] tracking-[-0.02em] text-section-fg sm:text-[56px]">
              {t("statsTitle")}
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-x-5 gap-y-7 sm:gap-x-7">
            {stats.map((s, i) => (
              <div key={s.n} className="border-b border-section-rule pb-5">
                <div className="font-display text-[40px] font-normal leading-none tracking-[-0.02em] text-ochre sm:text-[56px] lg:text-[64px]">
                  {s.n}
                </div>
                <p className="mt-2 font-body text-[12px] leading-[1.55] text-section-soft sm:text-[13px] sm:leading-[1.6]">
                  {i === 0
                    ? t.rich(`stats.${i}.t`, {
                        usda: (chunks) => (
                          <Link href="/pricing#faq-usda" className="underline underline-offset-2 hover:text-section-fg">
                            {chunks}
                          </Link>
                        ),
                      })
                    : s.t}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Подписка-тизер ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1320px] px-6 py-12 md:px-10 md:py-20 lg:px-14 lg:py-24">
        <div className="grid items-end gap-10 bg-crust px-6 py-10 md:px-14 md:py-12 lg:grid-cols-[1.3fr_1fr] lg:gap-14">
          <div>
            <Eyebrow color="text-ochre-dk">{t("subEyebrow")}</Eyebrow>
            <h2 className="mt-3.5 font-display text-[40px] font-normal leading-[0.92] tracking-[-0.03em] text-burg sm:text-[64px] lg:text-[80px]">
              {t("subTitle1")}
              <br />
              <em className="italic text-ochre">{t("subTitleAccent")}</em>
            </h2>
            <p className="mt-6 max-w-[540px] font-body text-[15px] leading-[1.75] text-ink">{t("subLede")}</p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <EditorialButton href="/pricing">{t("subCtaPremium")}</EditorialButton>
              <EditorialButton href="/pricing" variant="ghost">
                {t("subCtaCompare")}
              </EditorialButton>
            </div>
          </div>
          <div className="border-t border-rule pt-8 lg:border-l lg:border-t-0 lg:pl-9 lg:pt-0">
            <Eyebrow color="text-burg">{t("subLifetimeEyebrow")}</Eyebrow>
            <div className="my-3.5 font-display text-[80px] font-normal italic leading-[0.9] tracking-[-0.03em] text-burg lg:text-[100px]">
              €79
            </div>
            <p className="font-body text-[13px] leading-[1.7] text-soft">{t("subLifetimeLede")}</p>
            <div className="mt-4 font-body text-[11px] font-bold uppercase tracking-[0.16em] text-ochre-dk">
              <span className="text-olive">●</span> {t("subLifetimeSeats")}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

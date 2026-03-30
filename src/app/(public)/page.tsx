import Image from "next/image";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import FadeInUp from "@/components/animations/FadeInUp";
import WordReveal from "@/components/animations/WordReveal";
import RecipeCard from "@/components/recipe/RecipeCard";
import { fetchFeaturedRecipes } from "@/lib/supabase/server-queries";

const HERO_PHOTO = "/hero.png";

const ROW1 = [0, 1, 2];
const ROW2 = [3, 4, 5];

export default async function HomePage() {
  const [featured, t, locale] = await Promise.all([
    fetchFeaturedRecipes(),
    getTranslations("home"),
    getLocale(),
  ]);

  return (
    <main>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="flex flex-col lg:flex-row min-h-[100svh]">
        <div className="hero-image relative w-full h-[60vw] lg:h-auto lg:flex-1">
          <Image
            src={HERO_PHOTO}
            alt={t("heroAlt")}
            fill
            priority
            className="object-cover object-[center_40%]"
            sizes="(max-width: 1024px) 100vw, 55vw"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-cream/20 hidden lg:block" />
        </div>

        <div className="w-full lg:w-[45%] xl:w-[42%] flex flex-col justify-center px-8 lg:px-14 xl:px-20 py-16 bg-cream">
          <span className="hero-in-1 font-handwritten text-peach text-2xl block mb-8">
            {t("welcome")}
          </span>

          <h1 className="hero-in-2 font-serif text-[clamp(2.6rem,3.8vw,4.8rem)] leading-[1.06] text-charcoal mb-10">
            {t("heroLine1")}
            <br />
            {t("heroLine2")}
            <br />
            {t("heroLine3")}{" "}
            <em className="not-italic shimmer-text">{t("heroLine3accent")}</em>
          </h1>

          <div className="hero-in-3">
            <p className="text-charcoal/60 text-base leading-relaxed max-w-sm mb-5">
              {t("heroText1")}
            </p>
            <p className="text-charcoal/35 text-sm leading-relaxed max-w-sm mb-12">
              {t("heroText2")}
            </p>
          </div>

          <Link
            href="/recipes"
            className="
              hero-in-4
              inline-flex items-center gap-3 self-start
              bg-charcoal text-cream
              px-8 py-4 rounded-full text-sm font-medium
              hover:bg-peach transition-colors duration-300
            "
          >
            {t("viewRecipes")}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── Quote ─────────────────────────────────────────────────────────── */}
      <section className="bg-sand py-28 px-8">
        <blockquote className="max-w-2xl mx-auto text-center">
          <p className="font-handwritten text-[clamp(1.7rem,3vw,2.6rem)] text-charcoal/70 leading-relaxed">
            <WordReveal staggerDelay={0.05}>
              {t("quote")}
            </WordReveal>
          </p>
        </blockquote>
      </section>

      {/* ── Featured recipes ──────────────────────────────────────────────── */}
      <section className="py-24">
        <FadeInUp>
          <div className="flex items-end justify-between px-8 mb-12">
            <div>
              <span className="font-handwritten text-sage text-xl block mb-2">
                {t("fromBook")}
              </span>
              <h2 className="font-serif text-[clamp(2rem,3vw,3.2rem)] text-charcoal">
                {t("featuredTitle")}
              </h2>
            </div>
            {featured.length > 0 && (
              <Link
                href="/recipes"
                className="text-sm text-charcoal/40 hover:text-peach transition-colors duration-200 hidden sm:block"
              >
                {t("allRecipes")}
              </Link>
            )}
          </div>
        </FadeInUp>

        {featured.length === 0 ? (
          <FadeInUp>
            <div className="flex flex-col items-center justify-center py-16 px-8">
              <p className="font-handwritten text-2xl text-charcoal/30 text-center">
                {t("noRecipesTitle")}
              </p>
              <p className="text-sm text-charcoal/25 mt-3 text-center max-w-sm">
                {t("noRecipesSubtitle")}
              </p>
            </div>
          </FadeInUp>
        ) : (
          <>
            <div className="md:hidden grid grid-cols-2 gap-3 px-4">
              {featured.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} locale={locale} aspectClass="aspect-[3/4]" />
              ))}
            </div>

            <FadeInUp stagger>
              <div className="hidden md:flex flex-col gap-4 px-4">
                {featured.length >= 3 && (
                  <div className="grid grid-cols-12 gap-4 h-[380px]">
                    <div className="col-span-3 h-full"><RecipeCard recipe={featured[ROW1[0]]} locale={locale} fillHeight /></div>
                    <div className="col-span-5 h-full"><RecipeCard recipe={featured[ROW1[1]]} locale={locale} fillHeight /></div>
                    <div className="col-span-4 h-full"><RecipeCard recipe={featured[ROW1[2]]} locale={locale} fillHeight /></div>
                  </div>
                )}
                {featured.length >= 6 && (
                  <div className="grid grid-cols-12 gap-4 h-[260px]">
                    <div className="col-span-5 h-full"><RecipeCard recipe={featured[ROW2[0]]} locale={locale} fillHeight /></div>
                    <div className="col-span-4 h-full"><RecipeCard recipe={featured[ROW2[1]]} locale={locale} fillHeight /></div>
                    <div className="col-span-3 h-full"><RecipeCard recipe={featured[ROW2[2]]} locale={locale} fillHeight /></div>
                  </div>
                )}
                {featured.length < 3 && (
                  <div className="grid grid-cols-2 gap-4 h-[380px]">
                    {featured.map((recipe) => (
                      <RecipeCard key={recipe.id} recipe={recipe} locale={locale} fillHeight />
                    ))}
                  </div>
                )}
                {featured.length >= 4 && featured.length < 6 && (
                  <div className="grid grid-cols-12 gap-4 h-[260px]">
                    {featured.slice(3).map((recipe) => (
                      <div key={recipe.id} className="col-span-6 h-full">
                        <RecipeCard recipe={recipe} locale={locale} fillHeight />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FadeInUp>

            <FadeInUp delay={0.2}>
              <div className="flex justify-center mt-14">
                <Link
                  href="/recipes"
                  className="font-handwritten text-2xl text-charcoal/40 hover:text-peach transition-colors duration-200"
                >
                  {t("viewAll")}
                </Link>
              </div>
            </FadeInUp>
          </>
        )}
      </section>
    </main>
  );
}

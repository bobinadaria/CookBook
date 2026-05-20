import Image from "next/image";
import Link from "next/link";
import { getLocale } from "next-intl/server";
import RecipeCard from "@/components/recipe/RecipeCard";
import RevealCard from "@/components/animations/RevealCard";
import { DropCap, Eyebrow, EditorialButton, PullQuote } from "@/components/ui";
import { fetchFeaturedRecipes } from "@/lib/supabase/server-queries";
import type { LocaleCode } from "@/types";

const HERO_PHOTO = "/hero.png";

const STATS: [string, string][] = [
  ["±5%", "Точность КБЖУ. Через USDA-маппинг, не через ChatGPT, который ошибается на 30%."],
  ["10 / 5", "Welcome-кредитов AI на старте. Можно попробовать всю магию, не доставая карту."],
  ["€7.90", "Месяц Premium — снимает лимиты, открывает импорт, экспорт, тёмную тему."],
  ["50", "Lifetime-мест для первых читателей. Один платёж — навсегда."],
];

export default async function HomePage() {
  const [featured, rawLocale] = await Promise.all([fetchFeaturedRecipes(), getLocale()]);
  const locale = rawLocale as LocaleCode;

  return (
    <div className="bg-paper text-ink">
      {/* ── Hero spread ───────────────────────────────────────────────────── */}
      <section className="flex flex-col-reverse border-b border-rule lg:grid lg:grid-cols-[1fr_1.1fr] lg:min-h-[760px]">
        {/* Left — chapter header + headline + lede + meta */}
        <div className="flex flex-col justify-between gap-10 px-6 py-14 md:px-10 lg:px-14 lg:py-16">
          <Eyebrow color="text-ochre-dk">Глава I · Завтрак · Воскресный выпуск</Eyebrow>

          <div>
            <h1 className="font-display text-[clamp(3.25rem,8vw,120px)] font-normal leading-[0.88] tracking-[-0.03em] text-burg">
              Готовлю
              <br />
              <em className="italic text-ochre">для тех, кого люблю.</em>
            </h1>
            <p className="mt-7 max-w-[480px] font-body text-[17px] leading-[1.7] text-soft">
              Личная книга рецептов Дарьи Бобиной — из Праги, с AI-нутрициологом, который считает
              калории через USDA. Точно, без галлюцинаций. С запахом дома, который ты увезла с собой.
            </p>
          </div>

          <div>
            <div className="mb-6 flex flex-wrap items-center gap-4">
              <EditorialButton href="/recipes">Открыть номер &rarr;</EditorialButton>
              <EditorialButton href="/pricing" variant="ghost">
                42 рецепта · на пробу
              </EditorialButton>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-3 border-t border-rule pt-5 font-body text-[11px] font-semibold uppercase tracking-[0.13em] text-soft">
              <span>
                <b className="font-display text-[14px] italic text-burg">±5%</b> &nbsp;точность КБЖУ
              </span>
              <span>
                <b className="font-display text-[14px] italic text-burg">USDA</b> &nbsp;не галлюцинации
              </span>
              <span>
                <b className="font-display text-[14px] italic text-burg">2-я</b> &nbsp;на русском и английском
              </span>
            </div>
          </div>
        </div>

        {/* Right — full-bleed photo + magazine plate + caption */}
        <div className="relative aspect-[4/3] bg-crust lg:aspect-auto lg:min-h-[760px]">
          <Image
            src={HERO_PHOTO}
            alt="Готовлю для своих"
            fill
            priority
            className="object-cover object-[center_40%]"
            sizes="(max-width: 1024px) 100vw, 55vw"
          />
          <div className="absolute left-7 top-7 flex flex-col bg-ochre px-4 py-3">
            <span className="font-display text-[34px] italic leading-[0.95] text-burg">№ 01</span>
            <span className="mt-1 font-body text-[9px] font-bold uppercase tracking-[0.18em] text-burg">
              На обложке
            </span>
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/80 to-transparent px-8 pb-7 pt-24 text-paper">
            <Eyebrow color="text-paper/85">Fig. I — Портрет блюда</Eyebrow>
            <div className="mt-2 font-display text-[26px] italic leading-[1.15] text-paper sm:text-[30px]">
              Круассан с бри, сливой и фисташковой пастой
            </div>
            <div className="mt-2 font-body text-[11px] font-semibold uppercase tracking-[0.16em] text-paper/75">
              15 мин · 2 порции · 425 ккал · фото — Даша
            </div>
          </div>
        </div>
      </section>

      {/* ── Колонка редактора ─────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1320px] px-6 pb-14 pt-20 md:px-10 lg:px-14 lg:pt-[88px]">
        <div className="grid items-start gap-10 lg:grid-cols-[280px_1fr] lg:gap-14">
          <div>
            <Eyebrow color="text-ochre-dk">Слово редактора</Eyebrow>
            <h2 className="mt-3.5 font-display text-[44px] font-normal leading-[0.95] tracking-[-0.02em] text-burg sm:text-[56px]">
              Зачем
              <br />
              <em className="italic">эта книга.</em>
            </h2>
            <div className="mt-5 font-body text-[12px] font-medium leading-[1.7] text-soft">
              Эссе № 1
              <br />
              Опубликовано 15&nbsp;мая 2026
              <br />
              <span className="font-bold text-ochre-dk">4 минуты</span>
            </div>
          </div>

          <div className="max-w-[720px] font-reader text-[17px] leading-[1.85] text-ink">
            <p>
              <DropCap>Я</DropCap>в Праге двенадцатый год. Уехала с двумя чемоданами и страхом, что
              свой запах дома больше не повторишь. Тогда я начала записывать. Сначала — для себя,
              чтобы не забыть, как мама делала тесто. Потом — для подруг, которые приходили в гости и
              просили «пришли рецепт». Эта книга — то, что осталось.
            </p>
            <p className="mt-5">
              Здесь нет «здорового похудения», нет «ускоренного метаболизма», нет советов, которые ты
              слышала миллион раз. Здесь — то, что я готовлю по воскресеньям, когда хочется тишины и
              запаха чего-то хорошего. С историями. С точным КБЖУ через USDA. С местом, где ты можешь
              добавлять свои.
            </p>
            <p className="mt-5 italic text-soft">— Дарья Бобина, редактор. Прага, май 2026.</p>
          </div>
        </div>
      </section>

      {/* ── Pull quote ────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1320px] px-6 md:px-10 lg:px-14">
        <PullQuote author="Из колонки редактора, выпуск № 1">
          Еда — это не топливо. Это&nbsp;воспоминания, любовь и&nbsp;забота.
        </PullQuote>
      </section>

      {/* ── Содержание выпуска ────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1320px] px-6 py-16 md:px-10 lg:px-14">
        <div className="mb-9 flex items-end justify-between gap-6">
          <div>
            <Eyebrow color="text-ochre-dk">Содержание выпуска</Eyebrow>
            <h2 className="mt-3 font-display text-[44px] font-normal leading-[0.95] tracking-[-0.02em] text-burg sm:text-[64px] lg:text-[72px]">
              Шесть глав <em className="italic text-ochre">мая.</em>
            </h2>
          </div>
          <Link
            href="/recipes"
            className="hidden whitespace-nowrap font-body text-[12px] font-semibold uppercase tracking-[0.16em] text-burg transition-colors hover:text-ochre-dk sm:block"
          >
            Все рецепты &nbsp;&rarr;
          </Link>
        </div>

        {featured.length === 0 ? (
          <div className="flex flex-col items-center justify-center border-t border-rule py-20 text-center">
            <p className="font-display text-[28px] italic text-burg/40">Рецептов пока нет…</p>
            <p className="mt-3 max-w-sm font-body text-sm text-soft">
              Скоро здесь появятся самые любимые блюда — те, что готовятся с душой и теплом.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-x-9 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((recipe, i) => (
              <RevealCard key={recipe.id} index={i}>
                <RecipeCard recipe={recipe} locale={locale} index={i + 1} />
              </RevealCard>
            ))}
          </div>
        )}

        <div className="mt-12 flex justify-center sm:hidden">
          <EditorialButton href="/recipes" variant="ghost">
            Все рецепты &rarr;
          </EditorialButton>
        </div>
      </section>

      {/* ── Кухня в цифрах ────────────────────────────────────────────────── */}
      <section className="mt-14 bg-burg px-6 py-[72px] text-paper md:px-10 lg:px-14">
        <div className="mx-auto grid max-w-[1320px] items-center gap-12 lg:grid-cols-[1fr_2fr] lg:gap-14">
          <div>
            <Eyebrow color="text-ochre">Кухня в цифрах</Eyebrow>
            <h2 className="mt-3 font-display text-[40px] font-normal italic leading-[0.95] tracking-[-0.02em] text-paper sm:text-[56px]">
              Почему это не очередной сборник рецептов.
            </h2>
          </div>
          <div className="grid gap-7 sm:grid-cols-2">
            {STATS.map(([n, t]) => (
              <div key={n} className="border-b border-rule-invert pb-5">
                <div className="font-display text-[56px] font-normal leading-none tracking-[-0.02em] text-ochre sm:text-[64px]">
                  {n}
                </div>
                <p className="mt-2 font-body text-[13px] leading-[1.6] text-soft-invert">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Подписка-тизер ────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1320px] px-6 py-20 md:px-10 lg:px-14 lg:py-24">
        <div className="grid items-end gap-10 bg-crust px-6 py-12 md:px-14 lg:grid-cols-[1.3fr_1fr] lg:gap-14">
          <div>
            <Eyebrow color="text-ochre-dk">Подписка — €7.90 / мес</Eyebrow>
            <h2 className="mt-3.5 font-display text-[48px] font-normal leading-[0.92] tracking-[-0.03em] text-burg sm:text-[64px] lg:text-[80px]">
              Получи
              <br />
              <em className="italic text-ochre">весь номер.</em>
            </h2>
            <p className="mt-6 max-w-[540px] font-body text-[15px] leading-[1.75] text-ink">
              Free — твоя книга и десять кредитов AI, чтобы попробовать. Premium снимает потолки:
              безлимитный AI-нутрициолог, импорт рецепта с любого сайта, экспорт в PDF, тёмная тема и
              меню&nbsp;недели.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              <EditorialButton href="/pricing">Оформить Premium</EditorialButton>
              <EditorialButton href="/pricing" variant="ghost">
                Сравнить тарифы &rarr;
              </EditorialButton>
            </div>
          </div>
          <div className="border-t border-rule pt-8 lg:border-l lg:border-t-0 lg:pl-9 lg:pt-0">
            <Eyebrow color="text-burg">Lifetime · первые 50</Eyebrow>
            <div className="my-3.5 font-display text-[80px] font-normal italic leading-[0.9] tracking-[-0.03em] text-burg lg:text-[100px]">
              €79
            </div>
            <p className="font-body text-[13px] leading-[1.7] text-soft">
              Один платёж — Premium навсегда + 50 AI-картинок. Имя в colophon-е каждого выпуска.
              Закрытие — когда заполнятся все 50&nbsp;мест.
            </p>
            <div className="mt-4 font-body text-[11px] font-bold uppercase tracking-[0.16em] text-ochre-dk">
              <span className="text-olive">●</span> 37 / 50 уже заняты
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

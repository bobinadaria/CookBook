import type { Metadata } from "next";
import { Eyebrow, EditorialButton, PullQuote } from "@/components/ui";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Подписка",
  description:
    "Free, Premium и Lifetime — выбери, как читать «by Daria». Точный AI-нутрициолог, импорт, экспорт и меню недели.",
  alternates: { canonical: "/pricing" },
};

type FeatureValue = boolean | string;

interface Tier {
  key: "free" | "premium" | "lifetime";
  chapter: string;
  numeral: string;
  price: string;
  cadence: string;
  lede: string;
  features: [string, FeatureValue][];
  cta: string;
  ctaHref: string;
  ctaVariant: "ghost" | "solid" | "ochre";
  dark: boolean;
  bg: string;
  noteTop: string | null;
  noteBottom: string | null;
}

const TIERS: Tier[] = [
  {
    key: "free",
    chapter: "Гость",
    numeral: "I",
    price: "€0",
    cadence: "навсегда",
    lede: "Твоя книга, чтобы понять, нужно ли тебе больше. Без карты, без триала, без напоминаний.",
    features: [
      ["Каталог рецептов автора", true],
      ["Создание своих рецептов", "20 макс"],
      ["Welcome-кредиты AI", "10 КБЖУ + 5 рецептов"],
      ["Регулярный AI", "1 + 1 в месяц"],
      ["Избранное", "50 макс"],
      ["Личные заметки", true],
      ["Поделиться рецептом", true],
      ["Импорт с URL", false],
      ["Экспорт в PDF", false],
      ["Тёмная тема", false],
      ["Меню недели + список покупок", false],
      ["AI-картинки", false],
    ],
    cta: "Начать бесплатно",
    ctaHref: "/register",
    ctaVariant: "ghost",
    dark: false,
    bg: "bg-paper",
    noteTop: null,
    noteBottom: "Без карты",
  },
  {
    key: "premium",
    chapter: "Подписчик",
    numeral: "II",
    price: "€7.90",
    cadence: "/ мес или €69 / год",
    lede: "Безлимит AI, импорт, экспорт, меню недели. Тот самый «Notion от Бога», только для еды.",
    features: [
      ["Каталог рецептов автора", true],
      ["Создание своих рецептов", "безлимит"],
      ["Welcome-кредиты AI", "не нужны"],
      ["Регулярный AI", "безлимит"],
      ["Избранное", "безлимит"],
      ["Личные заметки", true],
      ["Поделиться рецептом", true],
      ["Импорт с URL", true],
      ["Экспорт в PDF", true],
      ["Тёмная тема", true],
      ["Меню недели + список покупок", true],
      ["AI-картинки", "кредитами"],
    ],
    cta: "Оформить Premium",
    ctaHref: "/register",
    ctaVariant: "solid",
    dark: true,
    bg: "bg-burg",
    noteTop: "Самый частый выбор",
    noteBottom: "Yearly: ≈ €5.75 / мес",
  },
  {
    key: "lifetime",
    chapter: "Учредитель",
    numeral: "III",
    price: "€79",
    cadence: "разово · первые 50",
    lede: "Один платёж, Premium навсегда. Имя в colophon-е каждого выпуска. Закрытие — как только заполнится.",
    features: [
      ["Всё, что в Premium", true],
      ["Premium навсегда", true],
      ["50 AI-картинок бонусом", true],
      ["Имя в colophon-е", true],
      ["Ранний доступ к новым главам", true],
      ["Прямой канал с автором", true],
      ["Совет по фичам", "голос"],
      ["Возможный B2B-тариф потом", "со скидкой"],
      ["Возврат в 30 дней", true],
      ["Перенос на другой email", true],
      ["Стикер «Учредитель» в комментариях", true],
    ],
    cta: "Стать учредителем · 37 / 50",
    ctaHref: "/register",
    ctaVariant: "ochre",
    dark: false,
    bg: "bg-crust",
    noteTop: "Закрывается при наборе 50",
    noteBottom: "13 мест осталось",
  },
];

const PACKS: [string, string, string][] = [
  ["S", "€4.90", "50 картинок"],
  ["M", "€9.90", "120 · бонус +20%"],
  ["L", "€19.90", "300 · бонус +50%"],
];

const FAQ: [string, string][] = [
  [
    "Какие карты принимаете?",
    "Любые ЕС/UK/US-карты через Paddle (он же выставляет чек и сам платит VAT за нас). Visa/Mastercard из Казахстана, Армении, Грузии, Израиля и ОАЭ работают. Карты, выпущенные в РФ, пока нет — смотрим в сторону крипты, скажу, когда будет.",
  ],
  [
    "Что если я подпишусь и пойму, что не моё?",
    "Отмена в один клик — деньги за неиспользованную часть месяца не возвращаются (это стандартная подписка). Для Lifetime — возврат в первые 30 дней, без вопросов.",
  ],
  [
    "AI правда считает точно?",
    "Точно — это ±5%. Маппим ингредиенты в USDA FoodData Central (государственная база ~400k продуктов) и считаем детерминированно. Это не ChatGPT, который врёт на 25-40%. Если ингредиент не нашёлся — спрашиваем тебя, не выдумываем.",
  ],
  [
    "Можно ли использовать книгу с клиентами (я тренер)?",
    "Сейчас — для личного использования. B2B-тариф запланирован на месяцы 10-12: экспорт PDF с твоим брендом, белые папки клиентов. Если нужно срочно — напиши, обсудим.",
  ],
  [
    "А если у меня ребёнок-аллергик?",
    "AI-генерация рецепта учитывает аллергии и нелюбимые продукты (нужно один раз настроить). Заметки и фильтры — на всех тарифах. Медицинских рекомендаций мы не даём — это правовая граница.",
  ],
];

function FeatureMark({ value, dark }: { value: FeatureValue; dark: boolean }) {
  if (value === true) return <span className="text-olive">●</span>;
  if (value === false)
    return <span className={dark ? "text-paper/35" : "text-muted"}>○</span>;
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

export default function PricingPage() {
  return (
    <div className="bg-paper text-ink">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1320px] px-6 pb-14 pt-16 md:px-10 lg:px-14 lg:pt-[72px]">
        <div className="grid items-end gap-10 lg:grid-cols-[1.4fr_1fr] lg:gap-14">
          <div>
            <Eyebrow color="text-ochre-dk">Подписка · с мая 2026</Eyebrow>
            <h1 className="mt-3.5 font-display text-[clamp(3rem,8vw,120px)] font-normal leading-[0.9] tracking-[-0.03em] text-burg">
              Получи
              <br />
              <em className="italic text-ochre">весь номер.</em>
            </h1>
          </div>
          <div>
            <p className="font-body text-[16px] leading-[1.75] text-ink">
              Free — твоя книга и десять кредитов AI, чтобы попробовать. Premium снимает потолки и
              добавляет нутри-магию. Lifetime — для первых пятидесяти; один платёж — навсегда.
              Картинки AI отдельно, кредитами.
            </p>
            <div className="mt-6 flex flex-wrap justify-between gap-x-6 gap-y-2 border-t-2 border-burg pt-5 font-body text-[11px] font-semibold uppercase tracking-[0.13em] text-soft">
              <span><span className="text-olive">●</span> отмена в один клик</span>
              <span><span className="text-olive">●</span> без рекламы</span>
              <span><span className="text-olive">●</span> VAT включён · Paddle</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 tiers ─────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1320px] px-6 pb-20 md:px-10 lg:px-14">
        <div className="grid grid-cols-1 lg:grid-cols-3">
          {TIERS.map((tier, i) => (
            <div
              key={tier.key}
              className={cn(
                "relative flex flex-col px-8 py-10",
                tier.bg,
                tier.dark ? "text-paper" : "text-ink",
                i < TIERS.length - 1 && "border-b border-rule lg:border-b-0 lg:border-r",
              )}
            >
              {tier.noteTop && (
                <div className="absolute inset-x-0 top-0 bg-ochre px-4 py-2 text-center font-body text-[10px] font-bold uppercase tracking-[0.16em] text-burg">
                  {tier.noteTop}
                </div>
              )}

              <div className={tier.noteTop ? "mt-6" : ""}>
                <div className="flex items-baseline gap-3.5">
                  <span className="font-display text-[44px] font-normal italic leading-[0.9] text-ochre sm:text-[48px]">
                    {tier.numeral}
                  </span>
                  <Eyebrow color={tier.dark ? "text-ochre" : "text-ochre-dk"}>
                    Глава · {tier.chapter}
                  </Eyebrow>
                </div>

                <div className="mt-5 font-display text-[72px] font-normal leading-[0.9] tracking-[-0.03em] sm:text-[88px]">
                  {tier.price}
                </div>
                <div
                  className={cn(
                    "mt-1.5 font-body text-[11px] font-semibold uppercase tracking-[0.16em]",
                    tier.dark ? "text-paper/70" : "text-soft",
                  )}
                >
                  {tier.cadence}
                </div>

                <p
                  className={cn(
                    "mt-4 font-reader text-[14px] italic leading-[1.7]",
                    tier.dark ? "text-paper/85" : "text-ink",
                  )}
                >
                  {tier.lede}
                </p>
              </div>

              {/* Features */}
              <div
                className={cn(
                  "mt-7 border-t",
                  tier.dark ? "border-rule-invert" : "border-rule",
                )}
              >
                {tier.features.map(([name, value], idx) => (
                  <div
                    key={idx}
                    className={cn(
                      "grid grid-cols-[1fr_auto] items-baseline gap-3 border-b py-2.5 text-[13px]",
                      tier.dark ? "border-rule-invert text-paper/88" : "border-rule text-ink",
                    )}
                  >
                    <span
                      className={cn(
                        value === false && "line-through",
                        value === false && (tier.dark ? "text-paper/40" : "text-muted"),
                      )}
                    >
                      {name}
                    </span>
                    <FeatureMark value={value} dark={tier.dark} />
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-auto pt-7">
                <EditorialButton variant={tier.ctaVariant} href={tier.ctaHref} className="w-full px-5 py-4">
                  {tier.cta}
                </EditorialButton>
                {tier.noteBottom && (
                  <div
                    className={cn(
                      "mt-3 text-center font-body text-[10px] font-semibold uppercase tracking-[0.16em]",
                      tier.dark ? "text-paper/60" : "text-soft",
                    )}
                  >
                    {tier.noteBottom}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── AI-картинки кредитами ───────────────────────────────────────── */}
      <section className="mx-auto max-w-[1320px] px-6 pb-20 md:px-10 lg:px-14">
        <div className="border-l-[6px] border-ochre bg-crust px-6 py-12 md:px-12">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_2fr] lg:gap-12">
            <div>
              <Eyebrow color="text-ochre-dk">AI-фотография · кредиты</Eyebrow>
              <h2 className="mt-3 font-display text-[40px] font-normal italic leading-[0.95] tracking-[-0.01em] text-burg sm:text-[52px]">
                Когда фото
                <br />
                нет — рисуем.
              </h2>
              <p className="mt-3.5 max-w-[360px] font-body text-[14px] leading-[1.7] text-soft">
                Свой стиль — top-down, тёплый свет, деревянная доска. Один пресет, узнаваемая
                визуальная ДНК книги. Только Premium-у, только за кредиты.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {PACKS.map(([size, price, desc]) => (
                <div key={size} className="border border-rule bg-paper px-6 py-6">
                  <div className="flex items-baseline justify-between">
                    <span className="font-display text-[40px] italic leading-none text-ochre">{size}</span>
                    <span className="font-body text-[10px] font-semibold uppercase tracking-[0.14em] text-soft">
                      пакет
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
        <PullQuote author="Анна, продакт-менеджер · Берлин · Lifetime">
          Я платила за Notion-шаблоны, бросала их через неделю. Это&nbsp;первая&nbsp;кулинарная
          подписка, которой я&nbsp;не&nbsp;стесняюсь.
        </PullQuote>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1320px] px-6 py-16 md:px-10 lg:px-14">
        <div className="grid items-start gap-10 lg:grid-cols-[1fr_2fr] lg:gap-14">
          <div>
            <Eyebrow color="text-ochre-dk">Часто спрашивают</Eyebrow>
            <h2 className="mt-3.5 font-display text-[44px] font-normal leading-[0.95] tracking-[-0.02em] text-burg sm:text-[64px] lg:text-[72px]">
              Прежде
              <br />
              чем платить —
              <br />
              <em className="italic text-ochre">прочитай.</em>
            </h2>
          </div>
          <div>
            {FAQ.map(([q, a], i) => (
              <details key={i} className="group border-t border-rule py-5">
                <summary className="flex cursor-pointer items-baseline justify-between gap-6">
                  <span className="font-display text-[20px] font-normal italic text-burg sm:text-[22px]">
                    {q}
                  </span>
                  <span className="shrink-0 font-body text-[11px] font-bold uppercase tracking-[0.13em] text-ochre-dk">
                    <span className="group-open:hidden">+ Открыть</span>
                    <span className="hidden group-open:inline">– Закрыть</span>
                  </span>
                </summary>
                <p className="mt-3.5 max-w-[640px] font-reader text-[14px] leading-[1.75] text-soft">
                  {a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────── */}
      <section className="mx-auto max-w-[1320px] px-6 pb-20 md:px-10 lg:px-14">
        <div className="grid items-center gap-10 bg-burg px-6 py-14 text-paper md:px-14 lg:grid-cols-[2fr_1fr] lg:gap-12">
          <div>
            <Eyebrow color="text-ochre">Готова?</Eyebrow>
            <h2 className="mb-4 mt-3.5 font-display text-[48px] font-normal leading-[0.92] tracking-[-0.03em] text-paper sm:text-[64px] lg:text-[80px]">
              Открыть
              <br />
              <em className="italic text-ochre">«by Daria».</em>
            </h2>
            <p className="max-w-[480px] font-body text-[16px] leading-[1.7] text-soft-invert">
              Free даёт книгу. Premium снимает потолки. Lifetime — для первых пятидесяти. Выбирай.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <EditorialButton variant="ochre" href="/register" className="w-full">
              Premium · €7.90 / мес
            </EditorialButton>
            <EditorialButton variant="paper" href="/register" className="w-full">
              Lifetime · €79 разово
            </EditorialButton>
            <EditorialButton
              variant="ghost"
              href="/recipes"
              className="w-full border-0 text-paper/70 hover:bg-transparent hover:text-paper"
            >
              Сначала бесплатно &rarr;
            </EditorialButton>
          </div>
        </div>
      </section>
    </div>
  );
}

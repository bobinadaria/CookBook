"use client";

import Link from "next/link";
import { useState } from "react";

export default function PrivacyPage() {
  const [lang, setLang] = useState<"ru" | "en">("ru");

  return (
    <main className="bg-paper px-6 py-20 md:px-10 lg:px-14">
      <div className="mx-auto max-w-[720px]">

        {/* Header */}
        <div className="mb-12 border-b border-rule pb-8">
          <p className="mb-3 font-body text-[10px] font-bold uppercase tracking-[0.25em] text-ochre">
            Legal
          </p>
          <h1 className="font-display text-[40px] font-normal italic leading-[1.05] tracking-[-0.02em] text-burg md:text-[52px]">
            Privacy Policy
          </h1>
          <p className="mt-3 font-body text-sm text-soft">
            Last updated: 26 June 2026 · Effective: 26 June 2026
          </p>

          {/* Language toggle */}
          <div className="mt-6 flex gap-1">
            <button
              onClick={() => setLang("ru")}
              className={`px-4 py-1.5 font-body text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors ${
                lang === "ru"
                  ? "bg-burg text-paper"
                  : "text-soft hover:text-ink"
              }`}
            >
              RU
            </button>
            <button
              onClick={() => setLang("en")}
              className={`px-4 py-1.5 font-body text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors ${
                lang === "en"
                  ? "bg-burg text-paper"
                  : "text-soft hover:text-ink"
              }`}
            >
              EN
            </button>
          </div>
        </div>

        {/* RU version */}
        {lang === "ru" && (
          <div>
            <Section title="1. О нас">
              <p>
                The Slow Table — личный кулинарный сервис на сайте <strong>bydaria.kitchen</strong>.
                Ответственная за обработку персональных данных: Дарья Бобина, Чешская Республика.
                По всем вопросам пишите на{" "}
                <a href="mailto:hello@bydaria.kitchen">hello@bydaria.kitchen</a>
              </p>
            </Section>
            <Section title="2. Какие данные мы собираем">
              <ul>
                <li><strong>Данные аккаунта:</strong> имя, электронная почта, пароль в зашифрованном виде — хранятся в Supabase. При входе через Google мы получаем имя и почту из вашего Google-аккаунта.</li>
                <li><strong>Платёжные данные:</strong> номера карт мы не видим и не храним — ими занимается Stripe напрямую. У нас хранится только ваш идентификатор в Stripe и статус подписки.</li>
                <li><strong>Ваш контент:</strong> рецепты, заметки к рецептам, избранное, фотографии — всё, что вы добавляете в «Мою книгу».</li>
                <li><strong>Технические данные:</strong> анонимная статистика посещений через Vercel Analytics и серверные логи. Сторонних рекламных трекеров мы не используем.</li>
              </ul>
            </Section>
            <Section title="3. Зачем нам ваши данные">
              <ul>
                <li>Чтобы вы могли войти в аккаунт и пользоваться сервисом.</li>
                <li>Чтобы проводить платежи через Stripe.</li>
                <li>Чтобы рассчитывать КБЖУ и генерировать обложки с помощью AI.</li>
                <li>Чтобы защищать сервис от злоупотреблений.</li>
                <li>Чтобы понимать, как улучшить сайт — на основе анонимной статистики.</li>
              </ul>
            </Section>
            <Section title="4. Кому мы передаём данные">
              <p>
                Ваши данные мы не продаём. Для работы сервиса мы пользуемся услугами
                следующих компаний:
              </p>
              <ul>
                <li><strong>Supabase</strong> (США / ЕС) — база данных и авторизация.</li>
                <li><strong>Stripe</strong> (США) — приём платежей. Имеет сертификацию PCI DSS.</li>
                <li><strong>Vercel</strong> (США) — хостинг сайта и аналитика посещений.</li>
                <li><strong>OpenAI</strong> (США) — расчёт КБЖУ. Мы передаём только текст состава рецепта.</li>
                <li><strong>Google</strong> (США) — генерация обложек и вход через Google.</li>
              </ul>
              <p>
                Все перечисленные компании работают в соответствии с европейским
                законодательством о защите данных.
              </p>
            </Section>
            <Section title="5. Ваши права">
              <p>
                Если вы живёте в Европейском союзе или Европейской экономической зоне, вы вправе:
              </p>
              <ul>
                <li>узнать, какие данные о вас хранятся;</li>
                <li>исправить устаревшие или неверные данные;</li>
                <li>попросить удалить аккаунт со всеми данными — просто напишите нам;</li>
                <li>получить свои данные в удобном для переноса формате;</li>
                <li>
                  подать жалобу в надзорный орган — в Чехии это{" "}
                  <a href="https://www.uoou.cz" target="_blank" rel="noopener noreferrer">ÚOOÚ</a>.
                </li>
              </ul>
            </Section>
            <Section title="6. Файлы cookie">
              <p>
                Мы используем только необходимые для работы сайта cookie: сессионные и языковые
                настройки, а также анонимную аналитику Vercel. Рекламных или отслеживающих
                cookie нет.
              </p>
            </Section>
            <Section title="7. Как долго мы храним данные">
              <p>
                Данные аккаунта хранятся, пока вы его не удалите. При удалении мы удаляем
                ваши рецепты, заметки и избранное. Stripe может хранить сведения о платежах
                в соответствии со своей политикой.
              </p>
            </Section>
            <Section title="8. Изменения политики">
              <p>
                Если мы внесём существенные изменения, дата вверху страницы обновится,
                а вы получите письмо на почту.
              </p>
            </Section>
            <Section title="9. Связь">
              <p>
                Вопросы о конфиденциальности:{" "}
                <a href="mailto:hello@bydaria.kitchen">hello@bydaria.kitchen</a>
              </p>
            </Section>
          </div>
        )}

        {/* EN version */}
        {lang === "en" && (
          <div>
            <Section title="1. Who We Are">
              <p>
                The Slow Table is a personal culinary service available at{" "}
                <strong>bydaria.kitchen</strong>. Data controller: Daria Bobina, Czech Republic.
                Contact: <a href="mailto:hello@bydaria.kitchen">hello@bydaria.kitchen</a>
              </p>
            </Section>
            <Section title="2. Data We Collect">
              <ul>
                <li><strong>Account:</strong> name, email address, hashed password (stored by Supabase). If you sign in with Google — your name and email from Google.</li>
                <li><strong>Payment data:</strong> we do not store card numbers. Stripe processes payments directly; we store only the Stripe customer ID and your plan status.</li>
                <li><strong>Content:</strong> recipes, notes, favourites, uploaded photos — anything you create in &ldquo;My Book&rdquo;.</li>
                <li><strong>Technical data:</strong> anonymous visit analytics (Vercel Analytics), server logs. No third-party trackers or ad pixels.</li>
              </ul>
            </Section>
            <Section title="3. How We Use Your Data">
              <ul>
                <li>Providing the service and authentication (legal basis: contract performance).</li>
                <li>Processing payments via Stripe (contract performance).</li>
                <li>AI nutrition calculation and cover generation (contract performance).</li>
                <li>Security and fraud prevention (legitimate interest).</li>
                <li>Service improvement via anonymous statistics (legitimate interest).</li>
              </ul>
            </Section>
            <Section title="4. Data Processors">
              <p>We do not sell your data. Sub-processors:</p>
              <ul>
                <li><strong>Supabase</strong> (US / EU) — database and authentication.</li>
                <li><strong>Stripe</strong> (US) — payment processing. PCI DSS certified.</li>
                <li><strong>Vercel</strong> (US) — hosting and analytics.</li>
                <li><strong>OpenAI</strong> (US) — AI nutrition calculation (ingredients text only).</li>
                <li><strong>Google</strong> (US) — cover image generation and Google sign-in.</li>
              </ul>
              <p>All sub-processors operate under EU Standard Contractual Clauses (SCC).</p>
            </Section>
            <Section title="5. Your Rights (GDPR)">
              <p>If you are in the EEA, you have the right to:</p>
              <ul>
                <li>access your personal data;</li>
                <li>correct inaccurate data;</li>
                <li>delete your account and all data (contact us);</li>
                <li>data portability;</li>
                <li>lodge a complaint with your supervisory authority (in Czech Republic: <a href="https://www.uoou.cz" target="_blank" rel="noopener noreferrer">ÚOOÚ</a>).</li>
              </ul>
            </Section>
            <Section title="6. Cookies">
              <p>We use only technically necessary cookies (session, language preference) and Vercel&apos;s anonymous analytics cookies. No advertising cookies or third-party tracking pixels.</p>
            </Section>
            <Section title="7. Retention">
              <p>Account data is retained until deletion. Stripe may retain transaction records per its own retention policy.</p>
            </Section>
            <Section title="8. Changes">
              <p>We will update the date at the top of this page when we make changes. For significant changes, we will notify you by email.</p>
            </Section>
            <Section title="9. Contact">
              <p><a href="mailto:hello@bydaria.kitchen">hello@bydaria.kitchen</a></p>
            </Section>
          </div>
        )}

        {/* Back link */}
        <div className="mt-16 border-t border-rule pt-8">
          <Link href="/" className="font-body text-sm text-soft hover:text-ochre-dk transition-colors">
            ← The Slow Table
          </Link>
          {" · "}
          <Link href="/terms" className="font-body text-sm text-soft hover:text-ochre-dk transition-colors">
            Terms of Service
          </Link>
        </div>

      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="mb-3 font-body text-[11px] font-bold uppercase tracking-[0.18em] text-ink">
        {title}
      </h3>
      <div className="space-y-2 font-body text-[15px] leading-relaxed text-ink [&_a]:text-ochre-dk [&_a:hover]:underline [&_ul]:mt-2 [&_ul]:space-y-1 [&_ul]:pl-4 [&_li]:list-disc">
        {children}
      </div>
    </div>
  );
}

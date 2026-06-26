import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — The Slow Table",
  description: "How The Slow Table collects, uses and protects your personal data.",
  robots: { index: true, follow: true },
};

export default function PrivacyPage() {
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
        </div>

        {/* RU version */}
        <div className="prose-editorial mb-16">
          <h2 className="mb-6 font-display text-2xl italic text-burg">
            Политика конфиденциальности
          </h2>

          <Section title="1. Кто мы">
            <p>
              The Slow Table — персональный кулинарный сервис, работающий по адресу{" "}
              <strong>bydaria.kitchen</strong>. Оператор данных: Дарья Бобина (далее —
              «мы», «нас»), Чешская Республика. Контакт:{" "}
              <a href="mailto:hello@bydaria.kitchen" className="text-ochre-dk hover:underline">
                hello@bydaria.kitchen
              </a>
            </p>
          </Section>

          <Section title="2. Какие данные мы собираем">
            <ul>
              <li>
                <strong>Аккаунт:</strong> имя, адрес электронной почты, хэш пароля (хранится
                Supabase, не мы). При входе через Google — имя и email из вашего аккаунта Google.
              </li>
              <li>
                <strong>Платёжные данные:</strong> мы не храним номера карт. Stripe обрабатывает
                платежи напрямую; мы храним только идентификатор клиента Stripe и статус плана
                (free / premium / lifetime).
              </li>
              <li>
                <strong>Контент:</strong> рецепты, заметки, избранное, загруженные фотографии
                — то, что вы создаёте в «Моей книге».
              </li>
              <li>
                <strong>Технические данные:</strong> анонимная аналитика посещений (Vercel
                Analytics), серверные логи. Мы не используем сторонние трекеры или рекламные
                пиксели.
              </li>
            </ul>
          </Section>

          <Section title="3. Зачем мы обрабатываем данные">
            <ul>
              <li>Предоставление сервиса и авторизация (правовое основание: исполнение договора).</li>
              <li>Обработка платежей через Stripe (исполнение договора).</li>
              <li>AI-расчёт КБЖУ и генерация обложек (исполнение договора).</li>
              <li>Безопасность, предотвращение мошенничества (законный интерес).</li>
              <li>Улучшение сервиса на основе анонимной статистики (законный интерес).</li>
            </ul>
          </Section>

          <Section title="4. Кому мы передаём данные">
            <p>Мы не продаём ваши данные. Мы используем следующих субпроцессоров:</p>
            <ul>
              <li>
                <strong>Supabase</strong> (США / ЕС) — база данных и авторизация.
              </li>
              <li>
                <strong>Stripe</strong> (США) — платёжная обработка. Stripe сертифицирован по
                PCI DSS.
              </li>
              <li>
                <strong>Vercel</strong> (США) — хостинг и аналитика.
              </li>
              <li>
                <strong>OpenAI</strong> (США) — AI-расчёт КБЖУ (мы передаём только текст
                состава рецепта).
              </li>
              <li>
                <strong>Google</strong> (США) — генерация обложек и авторизация через Google.
              </li>
            </ul>
            <p>
              Все субпроцессоры действуют в рамках стандартных договорных условий ЕС (SCC)
              или аналогичных механизмов передачи данных.
            </p>
          </Section>

          <Section title="5. Ваши права (GDPR)">
            <p>Если вы находитесь в ЕЭЗ, у вас есть право:</p>
            <ul>
              <li>получить доступ к своим данным;</li>
              <li>исправить неточные данные;</li>
              <li>удалить аккаунт и все данные (напишите нам);</li>
              <li>перенести данные в другой сервис;</li>
              <li>
                подать жалобу в надзорный орган (в Чехии —{" "}
                <a
                  href="https://www.uoou.cz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ochre-dk hover:underline"
                >
                  ÚOOÚ
                </a>
                ).
              </li>
            </ul>
          </Section>

          <Section title="6. Cookies">
            <p>
              Мы используем только технически необходимые cookies (сессия, языковые настройки)
              и анонимные аналитические cookies Vercel. Мы не используем рекламные cookies или
              отслеживающие пиксели третьих сторон.
            </p>
          </Section>

          <Section title="7. Срок хранения">
            <p>
              Данные аккаунта хранятся до момента его удаления. При удалении аккаунта мы
              удаляем ваши рецепты, заметки и избранное. Stripe может хранить транзакционные
              записи согласно своей политике хранения данных.
            </p>
          </Section>

          <Section title="8. Изменения">
            <p>
              При существенных изменениях мы обновим дату вверху страницы. Для значительных
              изменений уведомим по email.
            </p>
          </Section>

          <Section title="9. Контакт">
            <p>
              Вопросы о конфиденциальности:{" "}
              <a href="mailto:hello@bydaria.kitchen" className="text-ochre-dk hover:underline">
                hello@bydaria.kitchen
              </a>
            </p>
          </Section>
        </div>

        {/* Divider */}
        <div className="mb-16 flex items-center gap-4">
          <div className="h-px flex-1 bg-rule" />
          <span className="font-body text-[10px] uppercase tracking-[0.2em] text-muted">EN</span>
          <div className="h-px flex-1 bg-rule" />
        </div>

        {/* EN version */}
        <div className="prose-editorial">
          <h2 className="mb-6 font-display text-2xl italic text-burg">
            Privacy Policy (English)
          </h2>

          <Section title="1. Who We Are">
            <p>
              The Slow Table is a personal culinary service available at{" "}
              <strong>bydaria.kitchen</strong>. Data controller: Daria Bobina, Czech Republic.
              Contact:{" "}
              <a href="mailto:hello@bydaria.kitchen" className="text-ochre-dk hover:underline">
                hello@bydaria.kitchen
              </a>
            </p>
          </Section>

          <Section title="2. Data We Collect">
            <ul>
              <li>
                <strong>Account:</strong> name, email address, hashed password (stored by
                Supabase). If you sign in with Google — your name and email from Google.
              </li>
              <li>
                <strong>Payment data:</strong> we do not store card numbers. Stripe processes
                payments directly; we store only the Stripe customer ID and your plan status.
              </li>
              <li>
                <strong>Content:</strong> recipes, notes, favourites, uploaded photos — anything
                you create in &ldquo;My Book&rdquo;.
              </li>
              <li>
                <strong>Technical data:</strong> anonymous visit analytics (Vercel Analytics),
                server logs. No third-party trackers or ad pixels.
              </li>
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
            <p>We do not sell your data. We use the following sub-processors:</p>
            <ul>
              <li><strong>Supabase</strong> (US / EU) — database and authentication.</li>
              <li><strong>Stripe</strong> (US) — payment processing. PCI DSS certified.</li>
              <li><strong>Vercel</strong> (US) — hosting and analytics.</li>
              <li><strong>OpenAI</strong> (US) — AI nutrition calculation (ingredients text only).</li>
              <li><strong>Google</strong> (US) — cover image generation and Google sign-in.</li>
            </ul>
            <p>
              All sub-processors operate under EU Standard Contractual Clauses (SCC) or
              equivalent data transfer mechanisms.
            </p>
          </Section>

          <Section title="5. Your Rights (GDPR)">
            <p>If you are in the EEA, you have the right to:</p>
            <ul>
              <li>access your personal data;</li>
              <li>correct inaccurate data;</li>
              <li>delete your account and all data (contact us);</li>
              <li>data portability;</li>
              <li>
                lodge a complaint with your supervisory authority (in Czech Republic:{" "}
                <a
                  href="https://www.uoou.cz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ochre-dk hover:underline"
                >
                  ÚOOÚ
                </a>
                ).
              </li>
            </ul>
          </Section>

          <Section title="6. Cookies">
            <p>
              We use only technically necessary cookies (session, language preference) and
              Vercel&apos;s anonymous analytics cookies. No advertising cookies or third-party
              tracking pixels.
            </p>
          </Section>

          <Section title="7. Retention">
            <p>
              Account data is retained until deletion. When you delete your account, we delete
              your recipes, notes and favourites. Stripe may retain transaction records per its
              own retention policy.
            </p>
          </Section>

          <Section title="8. Changes">
            <p>
              We will update the date at the top of this page when we make changes. For
              significant changes, we will notify you by email.
            </p>
          </Section>

          <Section title="9. Contact">
            <p>
              Privacy questions:{" "}
              <a href="mailto:hello@bydaria.kitchen" className="text-ochre-dk hover:underline">
                hello@bydaria.kitchen
              </a>
            </p>
          </Section>
        </div>

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

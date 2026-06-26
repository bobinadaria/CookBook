import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — The Slow Table",
  description: "Terms and conditions for using The Slow Table.",
  robots: { index: true, follow: true },
};

export default function TermsPage() {
  return (
    <main className="bg-paper px-6 py-20 md:px-10 lg:px-14">
      <div className="mx-auto max-w-[720px]">

        {/* Header */}
        <div className="mb-12 border-b border-rule pb-8">
          <p className="mb-3 font-body text-[10px] font-bold uppercase tracking-[0.25em] text-ochre">
            Legal
          </p>
          <h1 className="font-display text-[40px] font-normal italic leading-[1.05] tracking-[-0.02em] text-burg md:text-[52px]">
            Terms of Service
          </h1>
          <p className="mt-3 font-body text-sm text-soft">
            Last updated: 26 June 2026 · Effective: 26 June 2026
          </p>
        </div>

        {/* RU version */}
        <div className="prose-editorial mb-16">
          <h2 className="mb-6 font-display text-2xl italic text-burg">
            Условия использования
          </h2>

          <Section title="1. Принятие условий">
            <p>
              Используя сайт <strong>bydaria.kitchen</strong> и сервис The Slow Table, вы
              соглашаетесь с настоящими Условиями. Если вы не согласны — пожалуйста, не
              используйте сервис.
            </p>
          </Section>

          <Section title="2. Описание сервиса">
            <p>
              The Slow Table — персональный кулинарный журнал с AI-нутрициологом. Сервис
              позволяет создавать и хранить рецепты, рассчитывать КБЖУ, генерировать обложки
              с помощью AI, а также просматривать авторский каталог рецептов Дарьи Бобиной.
            </p>
          </Section>

          <Section title="3. Аккаунт">
            <ul>
              <li>Вы несёте ответственность за сохранность данных вашего аккаунта.</li>
              <li>Один аккаунт — один человек; перепродажа доступа запрещена.</li>
              <li>Вы должны быть не моложе 16 лет для регистрации.</li>
            </ul>
          </Section>

          <Section title="4. Тарифы и оплата">
            <ul>
              <li>
                <strong>Free:</strong> базовый доступ к каталогу рецептов и созданию до 15
                собственных рецептов.
              </li>
              <li>
                <strong>Premium (€7,90/мес):</strong> ежемесячная подписка с AI-функциями.
                Оплачивается через Stripe. Вы можете отменить подписку в любой момент; доступ
                сохраняется до конца оплаченного периода.
              </li>
              <li>
                <strong>Lifetime (€79):</strong> единовременный платёж, бессрочный доступ к
                Premium-функциям.
              </li>
              <li>
                <strong>Пакеты обложек (S/M/L):</strong> единовременная покупка дополнительных
                AI-генераций обложек. Доступна только для Premium и Lifetime.
              </li>
            </ul>
          </Section>

          <Section title="5. Возвраты">
            <p>
              Платежи возврату не подлежат, за исключением случаев, предусмотренных применимым
              законодательством. Если у вас возникли проблемы — напишите нам, и мы постараемся
              решить их индивидуально.
            </p>
          </Section>

          <Section title="6. Ваш контент">
            <p>
              Рецепты и заметки, которые вы создаёте в «Моей книге», принадлежат вам. Вы
              предоставляете нам ограниченную лицензию на их хранение и отображение в вашем
              аккаунте. Ваши рецепты приватны по умолчанию и не видны другим пользователям.
            </p>
          </Section>

          <Section title="7. Авторские права">
            <p>
              Авторский каталог рецептов, тексты, фотографии и дизайн сайта принадлежат
              Дарье Бобиной и защищены авторским правом. Копирование контента без разрешения
              запрещено.
            </p>
          </Section>

          <Section title="8. AI-контент и точность КБЖУ">
            <p>
              Расчёты КБЖУ выполняются на основе данных USDA и являются оценочными. Они не
              являются медицинской или диетологической рекомендацией. Генерируемые AI-обложки
              — иллюстративные изображения, созданные автоматически. Мы не несём ответственности
              за решения, принятые на основании AI-контента.
            </p>
          </Section>

          <Section title="9. Ограничение ответственности">
            <p>
              Сервис предоставляется «как есть». Мы не гарантируем бесперебойную работу и не
              несём ответственности за косвенный или прямой ущерб, возникший при использовании
              сервиса, в максимальной мере, допустимой применимым законодательством.
            </p>
          </Section>

          <Section title="10. Прекращение доступа">
            <p>
              Мы вправе приостановить или закрыть аккаунт при нарушении настоящих Условий. Вы
              можете удалить аккаунт в любое время, написав на{" "}
              <a href="mailto:hello@bydaria.kitchen" className="text-ochre-dk hover:underline">
                hello@bydaria.kitchen
              </a>
              .
            </p>
          </Section>

          <Section title="11. Применимое право">
            <p>
              Настоящие Условия регулируются законодательством Чешской Республики. Споры
              рассматриваются в судах Чешской Республики.
            </p>
          </Section>

          <Section title="12. Контакт">
            <p>
              По всем вопросам:{" "}
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
            Terms of Service (English)
          </h2>

          <Section title="1. Acceptance">
            <p>
              By using <strong>bydaria.kitchen</strong> and The Slow Table service, you agree to
              these Terms. If you do not agree, please do not use the service.
            </p>
          </Section>

          <Section title="2. Service Description">
            <p>
              The Slow Table is a personal culinary journal with an AI nutritionist. It lets you
              create and store recipes, calculate nutrition (KBJU), generate AI cover images,
              and browse the author&apos;s recipe catalogue.
            </p>
          </Section>

          <Section title="3. Account">
            <ul>
              <li>You are responsible for keeping your account credentials secure.</li>
              <li>One account per person; reselling access is prohibited.</li>
              <li>You must be at least 16 years old to register.</li>
            </ul>
          </Section>

          <Section title="4. Plans and Payment">
            <ul>
              <li>
                <strong>Free:</strong> basic access to the recipe catalogue and up to 15
                personal recipes.
              </li>
              <li>
                <strong>Premium (€7.90/month):</strong> monthly subscription with AI features.
                Processed via Stripe. You may cancel at any time; access continues until the
                end of the paid period.
              </li>
              <li>
                <strong>Lifetime (€79):</strong> one-time payment for permanent Premium access.
              </li>
              <li>
                <strong>Cover Packs (S/M/L):</strong> one-time purchase of additional
                AI-generated covers. Available to Premium and Lifetime only.
              </li>
            </ul>
          </Section>

          <Section title="5. Refunds">
            <p>
              Payments are non-refundable except where required by applicable law. If you have
              an issue, contact us and we will do our best to resolve it.
            </p>
          </Section>

          <Section title="6. Your Content">
            <p>
              Recipes and notes you create in &quot;My Book&quot; belong to you. You grant us
              a limited licence to store and display them within your account. Your recipes are
              private by default and not visible to other users.
            </p>
          </Section>

          <Section title="7. Intellectual Property">
            <p>
              The author&apos;s recipe catalogue, texts, photographs and site design belong to
              Daria Bobina and are protected by copyright. Copying content without permission
              is prohibited.
            </p>
          </Section>

          <Section title="8. AI Content and Nutrition Accuracy">
            <p>
              Nutrition calculations are based on USDA data and are estimates only. They are
              not medical or dietary advice. AI-generated cover images are illustrative and
              created automatically. We are not liable for decisions made based on AI-generated
              content.
            </p>
          </Section>

          <Section title="9. Limitation of Liability">
            <p>
              The service is provided &quot;as is&quot;. We do not guarantee uninterrupted
              availability and are not liable for indirect or direct damages arising from use
              of the service, to the maximum extent permitted by applicable law.
            </p>
          </Section>

          <Section title="10. Termination">
            <p>
              We may suspend or close your account for violations of these Terms. You may
              delete your account at any time by emailing{" "}
              <a href="mailto:hello@bydaria.kitchen" className="text-ochre-dk hover:underline">
                hello@bydaria.kitchen
              </a>
              .
            </p>
          </Section>

          <Section title="11. Governing Law">
            <p>
              These Terms are governed by the laws of the Czech Republic. Disputes shall be
              resolved in the courts of the Czech Republic.
            </p>
          </Section>

          <Section title="12. Contact">
            <p>
              For any questions:{" "}
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
          <Link href="/privacy" className="font-body text-sm text-soft hover:text-ochre-dk transition-colors">
            Privacy Policy
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

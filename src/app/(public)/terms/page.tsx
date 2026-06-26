import Link from "next/link";
import { getLocale } from "next-intl/server";

export default async function TermsPage() {
  const locale = await getLocale();
  const isEn = locale === "en";

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
        {!isEn && (
          <div>
            <Section title="1. Принимая условия">
              <p>
                Пользуясь сайтом <strong>bydaria.kitchen</strong> и сервисом The Slow Table,
                вы соглашаетесь с этими условиями. Если вы с ними не согласны — просим не
                использовать сервис.
              </p>
            </Section>
            <Section title="2. Что такое The Slow Table">
              <p>
                Это личный кулинарный журнал с AI-нутрициологом. Здесь можно вести свою
                книгу рецептов, считать КБЖУ, генерировать обложки с помощью AI и читать
                авторский каталог рецептов Дарьи Бобиной.
              </p>
            </Section>
            <Section title="3. Аккаунт">
              <ul>
                <li>Вы отвечаете за сохранность своих данных для входа.</li>
                <li>Аккаунт создаётся для личного использования — передавать или перепродавать доступ нельзя.</li>
                <li>Для регистрации нужно быть не моложе 16 лет.</li>
              </ul>
            </Section>
            <Section title="4. Тарифы и оплата">
              <ul>
                <li><strong>Free:</strong> базовый доступ к каталогу рецептов и возможность создать до 15 собственных рецептов.</li>
                <li><strong>Premium — €7,90 в месяц:</strong> подписка с AI-функциями. Отменить можно в любой момент; доступ остаётся до конца оплаченного периода.</li>
                <li><strong>Lifetime — €79:</strong> разовый платёж, доступ к Premium навсегда.</li>
                <li><strong>Пакеты обложек S, M, L:</strong> разовая покупка дополнительных AI-генераций обложек. Доступны только для Premium и Lifetime.</li>
              </ul>
            </Section>
            <Section title="5. Возврат средств">
              <p>
                Оплаченные суммы не возвращаются, если иное не предусмотрено законодательством.
                Если что-то пошло не так — напишите нам, разберёмся.
              </p>
            </Section>
            <Section title="6. Ваши рецепты и заметки">
              <p>
                Всё, что вы создаёте в «Моей книге», принадлежит вам. Мы храним ваши материалы,
                чтобы показывать их вам в аккаунте. По умолчанию ваши рецепты видны только вам.
              </p>
            </Section>
            <Section title="7. Авторские права">
              <p>
                Авторский каталог рецептов, тексты, фотографии и дизайн сайта — это интеллектуальная
                собственность Дарьи Бобиной. Копировать и публиковать их без разрешения нельзя.
              </p>
            </Section>
            <Section title="8. Расчёт КБЖУ и AI-контент">
              <p>
                КБЖУ рассчитывается на основе базы данных USDA и носит ориентировочный характер.
                Это не медицинская рекомендация и не замена консультации диетолога. Обложки
                генерируются автоматически с помощью AI. Мы не несём ответственности за решения,
                принятые на основании этих данных.
              </p>
            </Section>
            <Section title="9. Ответственность">
              <p>
                Сервис работает в том виде, в каком есть. Мы стараемся обеспечить стабильную
                работу, но не можем гарантировать бесперебойный доступ. Мы не несём
                ответственности за косвенный ущерб, связанный с использованием сервиса.
              </p>
            </Section>
            <Section title="10. Блокировка аккаунта">
              <p>
                Мы вправе ограничить доступ к аккаунту при нарушении этих условий. Если вы
                хотите удалить аккаунт — напишите на{" "}
                <a href="mailto:hello@bydaria.kitchen">hello@bydaria.kitchen</a>, всё сделаем.
              </p>
            </Section>
            <Section title="11. Применимое право">
              <p>
                Эти условия регулируются законодательством Чешской Республики.
              </p>
            </Section>
            <Section title="12. Связь">
              <p>
                По любым вопросам:{" "}
                <a href="mailto:hello@bydaria.kitchen">hello@bydaria.kitchen</a>
              </p>
            </Section>
          </div>
        )}

        {/* EN version */}
        {isEn && (
          <div>
            <Section title="1. Acceptance">
              <p>By using <strong>bydaria.kitchen</strong> and The Slow Table service, you agree to these Terms. If you do not agree, please do not use the service.</p>
            </Section>
            <Section title="2. Service Description">
              <p>The Slow Table is a personal culinary journal with an AI nutritionist. It lets you create and store recipes, calculate nutrition (KBJU), generate AI cover images, and browse the author&apos;s recipe catalogue.</p>
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
                <li><strong>Free:</strong> basic access to the recipe catalogue and up to 15 personal recipes.</li>
                <li><strong>Premium (€7.90/month):</strong> monthly subscription with AI features. You may cancel at any time; access continues until the end of the paid period.</li>
                <li><strong>Lifetime (€79):</strong> one-time payment for permanent Premium access.</li>
                <li><strong>Cover Packs (S/M/L):</strong> one-time purchase of additional AI-generated covers. Available to Premium and Lifetime only.</li>
              </ul>
            </Section>
            <Section title="5. Refunds">
              <p>Payments are non-refundable except where required by applicable law. If you have an issue, contact us and we will do our best to resolve it.</p>
            </Section>
            <Section title="6. Your Content">
              <p>Recipes and notes you create in &quot;My Book&quot; belong to you. Your recipes are private by default and not visible to other users.</p>
            </Section>
            <Section title="7. Intellectual Property">
              <p>The author&apos;s recipe catalogue, texts, photographs and site design belong to Daria Bobina and are protected by copyright. Copying content without permission is prohibited.</p>
            </Section>
            <Section title="8. AI Content and Nutrition Accuracy">
              <p>Nutrition calculations are based on USDA data and are estimates only. They are not medical or dietary advice. We are not liable for decisions made based on AI-generated content.</p>
            </Section>
            <Section title="9. Limitation of Liability">
              <p>The service is provided &quot;as is&quot;. We are not liable for indirect or direct damages arising from use of the service, to the maximum extent permitted by applicable law.</p>
            </Section>
            <Section title="10. Termination">
              <p>We may suspend your account for violations of these Terms. You may delete your account by emailing{" "}
                <a href="mailto:hello@bydaria.kitchen" className="text-ochre-dk hover:underline">hello@bydaria.kitchen</a>.</p>
            </Section>
            <Section title="11. Governing Law">
              <p>These Terms are governed by the laws of the Czech Republic.</p>
            </Section>
            <Section title="12. Contact">
              <p><a href="mailto:hello@bydaria.kitchen" className="text-ochre-dk hover:underline">hello@bydaria.kitchen</a></p>
            </Section>
          </div>
        )}

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

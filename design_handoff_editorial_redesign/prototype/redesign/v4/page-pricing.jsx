// PRICING page — Подписка / 3 tiers as magazine columns
// Sections: header · 3 tiers · comparison · FAQ · testimonial · CTA

const PagePricing = ({ brandName }) => {
  const T = THEME4;

  return (
    <div style={{ background: T.paper, color: T.ink, fontFamily: T.body }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <section style={{ padding: '72px 56px 56px', maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 56, alignItems: 'end' }}>
          <div>
            <Eyebrow color={T.ochreDk}>Подписка · с мая 2026</Eyebrow>
            <h2 style={{
              fontFamily: T.display, fontWeight: 400, fontSize: 120, lineHeight: 0.9,
              letterSpacing: -3.4, margin: '14px 0 0', color: T.burg,
            }}>
              Получи<br/>
              <em style={{ fontStyle: 'italic', color: T.ochre }}>весь номер.</em>
            </h2>
          </div>
          <div>
            <p style={{ fontSize: 16, lineHeight: 1.75, color: T.ink, margin: 0 }}>
              Free — твоя книга и десять кредитов AI, чтобы попробовать. Premium снимает потолки и добавляет нутри-магию. Lifetime — для первых пятидесяти; один платёж — навсегда. Картинки AI отдельно, кредитами.
            </p>
            <div style={{
              marginTop: 22, paddingTop: 18, borderTop: `2px solid ${T.burg}`,
              display: 'flex', justifyContent: 'space-between',
              fontFamily: T.body, fontSize: 11, letterSpacing: 1.8, color: T.soft, fontWeight: 600, textTransform: 'uppercase',
            }}>
              <span><span style={{ color: T.olive }}>●</span> отмена в один клик</span>
              <span><span style={{ color: T.olive }}>●</span> без рекламы</span>
              <span><span style={{ color: T.olive }}>●</span> VAT включён · Paddle</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3 tiers ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '0 56px 80px', maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}>
          {[
            {
              key:'free',
              chap: 'Гость',
              num:  'I',
              price: '€0',
              cadence: 'навсегда',
              lede: 'Твоя книга, чтобы понять, нужно ли тебе больше. Без карты, без триала, без напоминаний.',
              features: [
                ['Каталог рецептов автора',          true],
                ['Создание своих рецептов',          '20 макс'],
                ['Welcome AI-кредиты',               '10 КБЖУ + 5 рецептов'],
                ['Регулярный AI',                    '1 + 1 в месяц'],
                ['Избранное',                        '50 макс'],
                ['Личные заметки',                   true],
                ['Поделиться рецептом',              true],
                ['Импорт с URL',                     false],
                ['Экспорт в PDF',                    false],
                ['Тёмная тема',                      false],
                ['Меню недели + список покупок',     false],
                ['AI-картинки',                      false],
              ],
              cta: 'Начать бесплатно',
              ctaVariant: 'ghost',
              bg: T.paper,
              accent: T.burg,
              noteTop: null,
              noteBottom: 'Без карты',
            },
            {
              key:'premium',
              chap: 'Подписчик',
              num:  'II',
              price: '€7.90',
              cadence: '/ мес или €69 / год',
              lede: 'Безлимит AI, импорт, экспорт, меню недели. Тот самый «Notion от Бога», только для еды.',
              features: [
                ['Каталог рецептов автора',          true],
                ['Создание своих рецептов',          'безлимит'],
                ['Welcome AI-кредиты',               'не нужны'],
                ['Регулярный AI',                    'безлимит'],
                ['Избранное',                        'безлимит'],
                ['Личные заметки',                   true],
                ['Поделиться рецептом',              true],
                ['Импорт с URL',                     true],
                ['Экспорт в PDF',                    true],
                ['Тёмная тема',                      true],
                ['Меню недели + список покупок',     true],
                ['AI-картинки',                      'кредитами'],
              ],
              cta: 'Оформить Premium',
              ctaVariant: 'solid',
              bg: T.burg,
              accent: T.paper,
              noteTop: 'Самый частый выбор',
              noteBottom: 'Yearly: ≈ €5.75 / мес',
            },
            {
              key:'lifetime',
              chap: 'Учредитель',
              num:  'III',
              price: '€79',
              cadence: 'разово · первые 50',
              lede: 'Один платёж, Premium навсегда. Имя в colophon-е каждого выпуска. Закрытие — как только заполнится.',
              features: [
                ['Всё, что в Premium',                true],
                ['Premium навсегда',                  true],
                ['50 AI-картинок бонусом',            true],
                ['Имя в colophon-е',                  true],
                ['Ранний доступ к новым главам',      true],
                ['Прямой канал с автором',            true],
                ['Совет по фичам',                    'голос'],
                ['Возможный B2B-тариф потом',         'со скидкой'],
                ['Возврат в 30 дней',                 true],
                ['Перенос на другой email',           true],
                ['Стикер «Учредитель» в комментариях', true],
                ['—',                                 ' '],
              ],
              cta: 'Стать учредителем · 37 / 50',
              ctaVariant: 'ochre',
              bg: T.crust,
              accent: T.burg,
              noteTop: 'Закрывается при наборе 50',
              noteBottom: '13 мест осталось',
            },
          ].map((tier, i) => (
            <div key={tier.key} style={{
              background: tier.bg, color: tier.accent,
              padding: '40px 32px 36px',
              borderRight: i < 2 ? `1px solid ${T.rule}` : 'none',
              display: 'flex', flexDirection: 'column',
              position: 'relative',
            }}>
              {tier.noteTop && (
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0,
                  background: T.ochre, color: T.burg,
                  padding: '8px 16px',
                  fontFamily: T.body, fontSize: 10, letterSpacing: 1.8, fontWeight: 700, textTransform: 'uppercase', textAlign: 'center',
                }}>{tier.noteTop}</div>
              )}

              <div style={{ marginTop: tier.noteTop ? 24 : 0 }}>
                {/* Chapter heading */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                  <span style={{ fontFamily: T.display, fontStyle: 'italic', fontSize: 48, lineHeight: 0.9, color: tier.key === 'premium' ? T.ochre : T.ochre, fontWeight: 400 }}>
                    {tier.num}
                  </span>
                  <Eyebrow color={tier.key === 'premium' ? T.ochre : T.ochreDk}>Глава · {tier.chap}</Eyebrow>
                </div>

                {/* Price */}
                <div style={{ marginTop: 22, display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontFamily: T.display, fontSize: 88, lineHeight: 0.9, letterSpacing: -2.4, color: tier.accent, fontWeight: 400 }}>
                    {tier.price}
                  </span>
                </div>
                <div style={{ marginTop: 6, fontFamily: T.body, fontSize: 11, letterSpacing: 1.8, color: tier.key === 'premium' ? 'rgba(242,237,227,.7)' : T.soft, fontWeight: 600, textTransform: 'uppercase' }}>
                  {tier.cadence}
                </div>

                {/* Lede */}
                <p style={{
                  marginTop: 18, fontSize: 14, lineHeight: 1.7,
                  color: tier.key === 'premium' ? 'rgba(242,237,227,.85)' : T.ink,
                  fontFamily: 'Newsreader, Georgia, serif', fontStyle: 'italic',
                }}>
                  {tier.lede}
                </p>
              </div>

              {/* Features */}
              <div style={{
                marginTop: 28, borderTop: `1px solid ${tier.key === 'premium' ? 'rgba(242,237,227,.2)' : T.rule}`,
              }}>
                {tier.features.map(([name, val], idx) => {
                  const isOn  = val === true;
                  const isOff = val === false;
                  const txt   = typeof val === 'string' ? val : null;
                  return (
                    <div key={idx} style={{
                      display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'baseline',
                      padding: '11px 0',
                      borderBottom: `1px solid ${tier.key === 'premium' ? 'rgba(242,237,227,.12)' : T.rule}`,
                      fontSize: 13, color: tier.key === 'premium' ? 'rgba(242,237,227,.88)' : T.ink,
                    }}>
                      <span style={{ opacity: isOff ? 0.4 : 1, textDecoration: isOff ? 'line-through' : 'none' }}>{name}</span>
                      <span style={{
                        fontFamily: txt ? T.body : 'inherit',
                        fontSize: 11, letterSpacing: txt ? 1.4 : 0,
                        fontWeight: 600, textTransform: txt ? 'uppercase' : 'none',
                        color: isOn  ? T.olive
                             : isOff ? (tier.key === 'premium' ? 'rgba(242,237,227,.35)' : T.muted)
                             : (tier.key === 'premium' ? T.ochre : T.ochreDk),
                      }}>
                        {isOn  ? '●'
                       : isOff ? '○'
                       : txt}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* CTA */}
              <div style={{ marginTop: 'auto', paddingTop: 28 }}>
                <EditorialButton
                  variant={tier.ctaVariant}
                  style={{ width: '100%', padding: '16px 20px' }}
                >
                  {tier.cta}
                </EditorialButton>
                {tier.noteBottom && (
                  <div style={{
                    marginTop: 12, textAlign: 'center',
                    fontFamily: T.body, fontSize: 10, letterSpacing: 1.6,
                    color: tier.key === 'premium' ? 'rgba(242,237,227,.6)' : T.soft, fontWeight: 600, textTransform: 'uppercase',
                  }}>{tier.noteBottom}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── AI-картинки кредитами ───────────────────────────────────────── */}
      <section style={{ padding: '0 56px 80px', maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ background: T.crust, padding: '48px 48px', borderLeft: `6px solid ${T.ochre}` }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 48, alignItems: 'center' }}>
            <div>
              <Eyebrow color={T.ochreDk}>AI-фотография · кредиты</Eyebrow>
              <h3 style={{ fontFamily: T.display, fontStyle: 'italic', fontSize: 52, color: T.burg, margin: '12px 0 0', letterSpacing: -1.2, fontWeight: 400 }}>
                Когда фото<br/>нет — рисуем.
              </h3>
              <p style={{ marginTop: 14, fontSize: 14, color: T.soft, lineHeight: 1.7, maxWidth: 360 }}>
                Свой стиль — top-down, тёплый свет, деревянная доска. Один пресет, узнаваемая визуальная ДНК книги. Только Premium-у, только за кредиты.
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 18 }}>
              {[
                ['S',  '€4.90',  '50 картинок'],
                ['M',  '€9.90',  '120 · бонус +20%'],
                ['L',  '€19.90', '300 · бонус +50%'],
              ].map(([s, p, n]) => (
                <div key={s} style={{ background: T.paper, padding: '24px 22px', border: `1px solid ${T.rule}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                    <span style={{ fontFamily: T.display, fontSize: 40, color: T.ochre, lineHeight: 1, fontStyle: 'italic' }}>{s}</span>
                    <span style={{ fontFamily: T.body, fontSize: 10, letterSpacing: 1.4, color: T.soft, fontWeight: 600, textTransform: 'uppercase' }}>пакет</span>
                  </div>
                  <div style={{ marginTop: 14, fontFamily: T.display, fontSize: 32, color: T.burg, lineHeight: 1, letterSpacing: -0.8 }}>{p}</div>
                  <div style={{ marginTop: 6, fontSize: 12, color: T.soft }}>{n}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pull quote / testimonial ────────────────────────────────────── */}
      <section style={{ padding: '0 56px', maxWidth: 1320, margin: '0 auto' }}>
        <PullQuote author="Анна, продакт-менеджер · Берлин · Lifetime">
          Я платила за Notion-шаблоны, бросала их через неделю. Это&nbsp;первая&nbsp;кулинарная подписка, которой я&nbsp;не&nbsp;стесняюсь.
        </PullQuote>
      </section>

      {/* ── FAQ ─────────────────────────────────────────────────────────── */}
      <section style={{ padding: '40px 56px 64px', maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 56, alignItems: 'start' }}>
          <div>
            <Eyebrow color={T.ochreDk}>Часто спрашивают</Eyebrow>
            <h3 style={{ fontFamily: T.display, fontWeight: 400, fontSize: 72, lineHeight: 0.95, color: T.burg, margin: '14px 0 0', letterSpacing: -2 }}>
              Прежде<br/>чем платить —<br/>
              <em style={{ fontStyle: 'italic', color: T.ochre }}>прочитай.</em>
            </h3>
          </div>
          <div>
            {[
              ['Какие карты принимаете?', 'Любые ЕС/UK/US-карты через Paddle (он же выставляет чек и сам платит VAT за нас). Visa/Mastercard из Казахстана, Армении, Грузии, Израиля и ОАЭ — работают. Карты, выпущенные в РФ, пока нет — на этом фронте смотрим в сторону крипты, скажу, когда будет.'],
              ['Что если я подпишусь и пойму, что не моё?', 'Отмена в один клик — деньги за неиспользованную часть месяца не возвращаются (это стандартная подписка). Для Lifetime — возврат в первые 30 дней, без вопросов.'],
              ['AI правда считает точно?', 'Точно — это ±5%. Маппим ингредиенты в USDA FoodData Central (государственная база ~400k продуктов) и считаем детерминированно. Это не ChatGPT, который врёт на 25-40%. Если ингредиент не нашёлся — спрашиваем тебя, не выдумываем.'],
              ['Можно ли использовать книгу с клиентами (я тренер)?', 'Сейчас — для личного использования. B2B-тариф запланирован на месяцы 10-12: экспорт PDF с твоим брендом, белые папки клиентов. Если это нужно срочно — напиши, обсудим.'],
              ['А если у меня ребёнок-аллергик?', 'AI-генерация рецепта учитывает аллергии и нелюбимые продукты (нужно один раз настроить). Заметки и фильтры — на всех тарифах. Медицинских рекомендаций мы не даём — это правовая граница.'],
            ].map(([q, a], i) => (
              <details key={i} style={{ padding: '20px 0', borderTop: `1px solid ${T.rule}` }}>
                <summary style={{
                  cursor: 'pointer', listStyle: 'none',
                  display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 24,
                  fontFamily: T.display, fontSize: 22, color: T.burg, fontStyle: 'italic', fontWeight: 400,
                }}>
                  <span>{q}</span>
                  <span style={{ fontFamily: T.body, fontSize: 11, letterSpacing: 1.6, color: T.ochreDk, fontWeight: 700, textTransform: 'uppercase' }}>+ Открыть</span>
                </summary>
                <p style={{ marginTop: 14, fontSize: 14, lineHeight: 1.75, color: T.soft, fontFamily: 'Newsreader, Georgia, serif' }}>
                  {a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────── */}
      <section style={{ padding: '40px 56px 80px', maxWidth: 1320, margin: '0 auto' }}>
        <div style={{
          background: T.burg, color: T.paper, padding: '64px 56px',
          display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 48, alignItems: 'center',
        }}>
          <div>
            <Eyebrow color={T.ochre}>Готова?</Eyebrow>
            <h3 style={{
              fontFamily: T.display, fontWeight: 400, fontSize: 80, lineHeight: 0.92,
              color: T.paper, margin: '14px 0 18px', letterSpacing: -2.4,
            }}>
              Открыть<br/>
              <em style={{ fontStyle: 'italic', color: T.ochre }}>«{brandName}».</em>
            </h3>
            <p style={{ fontSize: 16, lineHeight: 1.7, color: 'rgba(242,237,227,.78)', maxWidth: 480, margin: 0 }}>
              Free даёт книгу. Premium — снимает потолки. Lifetime — для первых пятидесяти. Выбирай.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <EditorialButton variant="ochre" style={{ width: '100%' }}>Premium · €7.90 / мес</EditorialButton>
            <EditorialButton variant="paper"  style={{ width: '100%' }}>Lifetime · €79 разово</EditorialButton>
            <button style={{
              background: 'transparent', color: 'rgba(242,237,227,.7)', border: 0, cursor: 'pointer',
              padding: '12px', fontFamily: T.body, fontSize: 11, letterSpacing: 1.8, fontWeight: 600, textTransform: 'uppercase',
            }}>Сначала бесплатно →</button>
          </div>
        </div>
      </section>

    </div>
  );
};

window.PagePricing = PagePricing;

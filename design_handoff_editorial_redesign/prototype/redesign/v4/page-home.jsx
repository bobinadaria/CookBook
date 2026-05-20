// HOME page — Дашин стол / Editorial magazine
// Sections: Hero · Колонка редактора · Pull quote · Содержание · Кухня в цифрах · Подписка-тизер

const PageHome = ({ brandName, headline }) => {
  const T = THEME4;
  return (
    <div style={{ background: T.paper, color: T.ink, fontFamily: T.body }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{
        display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 0,
        minHeight: 760, borderBottom: `1px solid ${T.rule}`,
      }}>
        {/* Left: chapter header + headline + lede + meta */}
        <div style={{ padding: '64px 56px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Eyebrow color={T.ochreDk}>Глава I · Завтрак · Воскресный выпуск</Eyebrow>

          <div style={{ paddingTop: 18 }}>
            <h2 style={{
              fontFamily: T.display, fontWeight: 400, fontSize: 120, lineHeight: 0.88,
              letterSpacing: -3.4, margin: 0, color: T.burg,
            }}>
              {headline.h1}<br/>
              <em style={{ fontStyle: 'italic', color: T.ochre }}>{headline.h2}</em>
            </h2>
            <p style={{ marginTop: 30, fontSize: 17, lineHeight: 1.7, color: T.soft, maxWidth: 480 }}>
              {headline.lede}
            </p>
          </div>

          <div style={{ marginTop: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 22 }}>
              <EditorialButton>Открыть номер →</EditorialButton>
              <EditorialButton variant="ghost">42 рецепта &nbsp;·&nbsp; на пробу</EditorialButton>
            </div>
            <div style={{
              display: 'flex', gap: 32, paddingTop: 22, borderTop: `1px solid ${T.rule}`,
              fontSize: 11, letterSpacing: 1.4, color: T.soft, fontWeight: 600, textTransform: 'uppercase',
            }}>
              <span><b style={{ color: T.burg, fontWeight: 700, fontFamily: T.display, fontSize: 14, fontStyle: 'italic' }}>±5%</b> &nbsp; точность КБЖУ</span>
              <span><b style={{ color: T.burg, fontWeight: 700, fontFamily: T.display, fontSize: 14, fontStyle: 'italic' }}>USDA</b> &nbsp; не галлюцинации</span>
              <span><b style={{ color: T.burg, fontWeight: 700, fontFamily: T.display, fontSize: 14, fontStyle: 'italic' }}>2-я</b> &nbsp; на немецком и русском</span>
            </div>
          </div>
        </div>

        {/* Right: full-bleed photo + magazine plate */}
        <div style={{ position: 'relative', background: T.crust }}>
          <HeroPhoto />
          {/* Ochre plate top-left */}
          <div style={{
            position: 'absolute', top: 28, left: 28, padding: '12px 16px',
            background: T.ochre, display: 'flex', flexDirection: 'column',
          }}>
            <span style={{ fontFamily: T.display, fontSize: 38, lineHeight: 0.95, color: T.burg, fontStyle: 'italic' }}>№ 01</span>
            <span style={{ fontFamily: T.body, fontSize: 9, letterSpacing: 1.8, color: T.burg, fontWeight: 700, textTransform: 'uppercase', marginTop: 4 }}>На обложке</span>
          </div>
          {/* Caption */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(180deg, transparent, rgba(21,17,13,.78))',
            padding: '90px 32px 28px', color: T.paper,
          }}>
            <Eyebrow style={{ color: 'rgba(242,237,227,.85)', marginBottom: 8 }}>Fig. I — Портрет блюда</Eyebrow>
            <div style={{ fontFamily: T.display, fontStyle: 'italic', fontSize: 30, lineHeight: 1.15, color: T.paper }}>
              Круассан с бри, сливой и фисташковой пастой
            </div>
            <div style={{ fontFamily: T.body, fontSize: 11, letterSpacing: 1.8, color: 'rgba(242,237,227,.75)', fontWeight: 600, textTransform: 'uppercase', marginTop: 8 }}>
              15 мин · 2 порции · 425 ккал · фото — Даша
            </div>
          </div>
        </div>
      </section>

      {/* ── Колонка редактора ───────────────────────────────────────────── */}
      <section style={{ padding: '88px 56px 56px', maxWidth: 1320, margin: '0 auto' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '280px 1fr', gap: 56, alignItems: 'start',
        }}>
          <div>
            <Eyebrow color={T.ochreDk}>Слово редактора</Eyebrow>
            <h3 style={{
              fontFamily: T.display, fontWeight: 400, fontSize: 56, lineHeight: 0.95,
              color: T.burg, margin: '14px 0 0', letterSpacing: -1.5,
            }}>
              Зачем<br/>
              <em style={{ fontStyle: 'italic' }}>эта книга.</em>
            </h3>
            <div style={{ marginTop: 22, fontSize: 12, color: T.soft, fontFamily: T.body, lineHeight: 1.7, fontWeight: 500 }}>
              Эссе № 1<br/>
              Опубликовано 15&nbsp;мая 2026<br/>
              <span style={{ color: T.ochreDk, fontWeight: 700 }}>4 минуты</span>
            </div>
          </div>

          <div style={{ fontSize: 17, lineHeight: 1.85, color: T.ink, maxWidth: 720, fontFamily: 'Newsreader, Georgia, serif' }}>
            <p style={{ margin: 0 }}>
              <DropCap>Я</DropCap>в Праге двенадцатый год. Уехала из Москвы в 2014-м — с двумя чемоданами и страхом, что свой запах дома больше не повторишь. Тогда я начала записывать. Сначала — для себя, чтобы не забыть, как мама делала тесто. Потом — для подруг, которые приходили в гости и просили «пришли рецепт». Эта книга — то, что осталось.
            </p>
            <p style={{ marginTop: 22 }}>
              Здесь нет «здорового похудения», нет «ускоренного метаболизма», нет советов, которые ты слышала миллион раз. Здесь — то, что я готовлю по воскресеньям, когда хочется тишины и запаха чего-то хорошего. С историями. С точным КБЖУ через USDA (не галлюцинации, нет). С местом, где ты можешь добавлять свои.
            </p>
            <p style={{ marginTop: 22, fontStyle: 'italic', color: T.soft }}>
              — Дарья Бобина, редактор. Прага, май 2026.
            </p>
          </div>
        </div>
      </section>

      {/* ── Pull quote ──────────────────────────────────────────────────── */}
      <section style={{ padding: '0 56px', maxWidth: 1320, margin: '0 auto' }}>
        <PullQuote author="Из колонки редактора, выпуск № 1">
          Еда — это не топливо.<br/>Это&nbsp;воспоминания, любовь и&nbsp;забота.
        </PullQuote>
      </section>

      {/* ── Содержание выпуска ──────────────────────────────────────────── */}
      <section style={{ padding: '64px 56px', maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 36 }}>
          <div>
            <Eyebrow color={T.ochreDk}>Содержание выпуска</Eyebrow>
            <h3 style={{
              fontFamily: T.display, fontWeight: 400, fontSize: 72, lineHeight: 0.95,
              color: T.burg, margin: '12px 0 0', letterSpacing: -2,
            }}>
              Шесть глав <em style={{ fontStyle: 'italic', color: T.ochre }}>мая.</em>
            </h3>
          </div>
          <button style={{
            background: 'transparent', border: 0, cursor: 'pointer',
            fontFamily: T.body, fontSize: 12, letterSpacing: 1.8, color: T.burg, fontWeight: 600, textTransform: 'uppercase',
          }}>Все рецепты &nbsp;→</button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 36, rowGap: 56 }}>
          {[
            { n: 'I',   t: 'Круассан с бри, сливой и фисташковой пастой', cat: 'Завтрак',   kcal: 425, mins: 15, p: '008', tone: 'warm',  hero: true },
            { n: 'II',  t: 'Тыква с тахини, кинзой и тимьяном',           cat: 'Ужин',      kcal: 310, mins: 35, p: '014', tone: 'olive' },
            { n: 'III', t: 'Творожник с инжиром и мёдом',                 cat: 'Десерт',    kcal: 280, mins: 50, p: '022', tone: 'mauve' },
            { n: 'IV',  t: 'Греческий салат с малиновым уксусом',          cat: 'Обед',      kcal: 220, mins: 12, p: '028', tone: 'olive' },
            { n: 'V',   t: 'Лосось медленного запекания с укропом',        cat: 'На вечер',  kcal: 380, mins: 45, p: '034', tone: 'cream' },
            { n: 'VI',  t: 'Холодник со сметаной и редисом',               cat: 'Лето · обед', kcal: 195, mins: 20, p: '040', tone: 'mauve' },
          ].map((r) => (
            <article key={r.n} style={{ cursor: 'pointer' }}>
              <div style={{ height: 300, marginBottom: 18, overflow: 'hidden', position: 'relative' }}>
                {r.hero
                  ? <HeroPhoto />
                  : <Placeholder w="100%" h="100%" tone={r.tone} label="ФОТО · top-down" />
                }
                <div style={{
                  position: 'absolute', top: 12, left: 12, padding: '6px 10px',
                  background: T.ochre, fontFamily: T.body, fontSize: 10, letterSpacing: 1.8,
                  color: T.burg, fontWeight: 700, textTransform: 'uppercase',
                }}>P. {r.p}</div>
              </div>

              <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
                <span style={{ fontFamily: T.display, fontStyle: 'italic', fontSize: 56, lineHeight: 0.9, color: T.ochre, fontWeight: 400 }}>
                  {r.n}
                </span>
                <div style={{ flex: 1 }}>
                  <Eyebrow style={{ marginBottom: 6 }}>{r.cat}</Eyebrow>
                  <div style={{ fontFamily: T.display, fontSize: 24, lineHeight: 1.15, color: T.ink }}>
                    {r.t}
                  </div>
                </div>
              </div>
              <div style={{
                borderTop: `1px solid ${T.rule}`, marginTop: 14, paddingTop: 12,
                display: 'flex', justifyContent: 'space-between',
                fontFamily: T.body, fontSize: 11, letterSpacing: 1.6, color: T.soft, fontWeight: 600, textTransform: 'uppercase',
              }}>
                <span>{r.mins} мин</span>
                <span style={{ color: T.ochreDk }}>{r.kcal} ккал</span>
                <span>Читать →</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* ── Кухня в цифрах (proof / KPI strip) ──────────────────────────── */}
      <section style={{ background: T.burg, color: T.paper, padding: '72px 56px', marginTop: 56 }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 56, alignItems: 'center' }}>
          <div>
            <Eyebrow color={T.ochre}>Кухня в цифрах</Eyebrow>
            <h3 style={{
              fontFamily: T.display, fontWeight: 400, fontStyle: 'italic',
              fontSize: 56, lineHeight: 0.95, color: T.paper, margin: '12px 0 0', letterSpacing: -1.5,
            }}>
              Почему это<br/>не очередной<br/>сборник рецептов.
            </h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 28 }}>
            {[
              ['±5%',   'Точность КБЖУ. Через USDA-маппинг, не через ChatGPT, который ошибается на 30%.'],
              ['10 / 5', 'Welcome AI-кредитов на старте. Можно попробовать всю магию, не доставая карту.'],
              ['€7.90', 'Месяц Premium — снимает лимиты, открывает импорт, экспорт, тёмную тему.'],
              ['50',    'Lifetime-мест для первых читателей. Один платёж — навсегда.'],
            ].map(([n, t]) => (
              <div key={n} style={{ paddingBottom: 18, borderBottom: `1px solid rgba(242,237,227,.2)` }}>
                <div style={{ fontFamily: T.display, fontSize: 64, lineHeight: 1, color: T.ochre, letterSpacing: -2, fontWeight: 400 }}>
                  {n}
                </div>
                <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.6, color: 'rgba(242,237,227,.82)' }}>
                  {t}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Подписка-тизер ──────────────────────────────────────────────── */}
      <section style={{ padding: '96px 56px', maxWidth: 1320, margin: '0 auto' }}>
        <div style={{
          background: T.crust, padding: '64px 56px',
          display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 56, alignItems: 'end',
        }}>
          <div>
            <Eyebrow color={T.ochreDk}>Подписка — €7.90 / мес</Eyebrow>
            <h3 style={{
              fontFamily: T.display, fontWeight: 400, fontSize: 80, lineHeight: 0.92,
              color: T.burg, margin: '14px 0 0', letterSpacing: -2.4,
            }}>
              Получи<br/>
              <em style={{ fontStyle: 'italic', color: T.ochre }}>весь номер.</em>
            </h3>
            <p style={{ marginTop: 24, fontSize: 15, lineHeight: 1.75, color: T.ink, maxWidth: 540 }}>
              Free — твоя книга и десять AI-кредитов, чтобы попробовать. Premium снимает потолки: безлимитный AI-нутрициолог, импорт рецепта с любого сайта, экспорт в PDF, тёмная тема, безлимитное создание своих рецептов и меню&nbsp;недели.
            </p>
            <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <EditorialButton>Оформить Premium</EditorialButton>
              <EditorialButton variant="ghost">Сравнить тарифы →</EditorialButton>
            </div>
          </div>
          <div style={{ borderLeft: `1px solid ${T.rule}`, paddingLeft: 36 }}>
            <Eyebrow color={T.burg}>Lifetime · первые 50</Eyebrow>
            <div style={{
              fontFamily: T.display, fontStyle: 'italic', fontSize: 100, lineHeight: 0.9,
              color: T.burg, margin: '14px 0', letterSpacing: -3,
            }}>€79</div>
            <p style={{ fontSize: 13, color: T.soft, lineHeight: 1.7, margin: 0 }}>
              Один платёж — Premium навсегда + 50 AI-картинок. Имя в colophon-е каждого выпуска. Закрытие — когда заполнятся все 50&nbsp;мест.
            </p>
            <div style={{ marginTop: 18, fontFamily: T.body, fontSize: 11, letterSpacing: 1.8, color: T.ochreDk, fontWeight: 700, textTransform: 'uppercase' }}>
              ● 37 / 50 уже заняты
            </div>
          </div>
        </div>
      </section>

    </div>
  );
};

window.PageHome = PageHome;

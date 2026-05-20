// Direction 4 — Bold Magazine: "Гастро-журнал"
// References: Apartamento, Wallpaper, Cherry Bombe, Vogue.
// Mood: confident editorial spread, huge display serif, drop caps, pull quotes,
// magazine-grade composition. Visually the most distinctive.

const D4 = () => {
  const T = {
    paper:   '#F2EDE3',
    crust:   '#E8DFCB',
    burg:    '#4A1E1E',     // deep burgundy — primary
    ochre:   '#C99846',     // mustard ochre — secondary accent
    olive:   '#6B7B4F',     // olive — third accent
    ink:     '#15110D',
    soft:    'rgba(21,17,13,.55)',
    rule:    'rgba(21,17,13,.18)',
    display: '"Bodoni Moda", "Playfair Display", "Cormorant Garamond", serif',
    body:    '"Work Sans", system-ui, sans-serif',
    sans:    '"Work Sans", system-ui, sans-serif',
  };

  return (
    <div style={{
      width: '100%', height: '100%', background: T.paper, color: T.ink,
      fontFamily: T.body, fontSize: 14, lineHeight: 1.5,
      padding: '56px 60px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 44,
    }}>
      {/* Heading */}
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 40 }}>
        <div>
          <div style={{
            fontFamily: T.body, fontSize: 11, letterSpacing: 3, color: T.burg,
            fontWeight: 600, textTransform: 'uppercase', marginBottom: 14,
          }}>
            N° 04 — Direction
          </div>
          <h1 style={{
            fontFamily: T.display, fontWeight: 400, fontSize: 110, lineHeight: 0.88,
            letterSpacing: -3, margin: 0, color: T.burg,
          }}>
            Гастро-<br />
            <em style={{ fontStyle: 'italic', color: T.ochre }}>журнал.</em>
          </h1>
          <p style={{ margin: '20px 0 0', fontSize: 14, color: T.soft, maxWidth: 560, lineHeight: 1.7 }}>
            Самое смелое направление. Книга превращается в журнал: огромная типографика с высоким контрастом штрихов, буквицы, пулл-цитаты, асимметричные развороты. Бордо + горчица + олива — палитра дорогих фуд-журналов. Премиум читается мгновенно.
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: T.display, fontStyle: 'italic', fontSize: 64, lineHeight: 1, color: T.olive }}>est.</div>
          <div style={{ fontFamily: T.display, fontSize: 32, lineHeight: 1, color: T.burg }}>MMXXVI</div>
        </div>
      </header>

      <div style={{ height: 2, background: T.burg }} />

      {/* Palette + Type */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 56 }}>
        <div>
          <SectionLabel font={T.body} style={{ color: T.burg, fontWeight: 600 }}>ПАЛИТРА</SectionLabel>
          <div style={{ display: 'flex', gap: 18 }}>
            <Swatch name="Paper"     hex={T.paper} value="#F2EDE3" />
            <Swatch name="Crust"     hex={T.crust} value="#E8DFCB" />
            <Swatch name="Burgundy"  hex={T.burg}  value="#4A1E1E" />
            <Swatch name="Ochre"     hex={T.ochre} value="#C99846" />
            <Swatch name="Olive"     hex={T.olive} value="#6B7B4F" />
          </div>
          <div style={{ marginTop: 16, fontSize: 12, color: T.soft, lineHeight: 1.7, maxWidth: 360 }}>
            Бордо — голос книги, цвет «обложки». Горчица — для буквиц, выделений, имен глав. Олива — sage-функция (здоровье/КБЖУ).
          </div>
        </div>

        <div>
          <SectionLabel font={T.body} style={{ color: T.burg, fontWeight: 600 }}>ТИПОГРАФИКА</SectionLabel>
          <div style={{ borderTop: `1px solid ${T.rule}`, paddingTop: 18 }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: T.display, fontWeight: 400, fontSize: 72, lineHeight: 1, letterSpacing: -2, color: T.burg }}>
                Bodoni Moda
              </div>
              <div style={{ fontSize: 11, color: T.soft, marginTop: 4, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 600 }}>
                Display · 400 / 400 italic
              </div>
            </div>
            <div style={{ borderTop: `1px solid ${T.rule}`, paddingTop: 14, marginBottom: 14 }}>
              <div style={{ fontFamily: T.display, fontStyle: 'italic', fontSize: 32, lineHeight: 1.1, color: T.ochre }}>
                «pull quotes &amp; chapter intros»
              </div>
              <div style={{ fontSize: 11, color: T.soft, marginTop: 6, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 600 }}>
                Italic display — цитаты, вставки
              </div>
            </div>
            <div style={{ borderTop: `1px solid ${T.rule}`, paddingTop: 14 }}>
              <div style={{ fontFamily: T.body, fontWeight: 500, fontSize: 18 }}>
                Work Sans — body, шапки разделов, кнопки
              </div>
              <div style={{ fontSize: 11, color: T.soft, marginTop: 6, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 600 }}>
                Sans · 400 / 500 / 600
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero — magazine spread */}
      <div>
        <SectionLabel font={T.body} style={{ color: T.burg, fontWeight: 600 }}>ОБЛОЖКА · РАЗВОРОТ</SectionLabel>
        <div style={{
          background: T.crust, borderRadius: 2, padding: 36,
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36, alignItems: 'stretch',
          minHeight: 580, position: 'relative',
        }}>
          {/* Page meta */}
          <div style={{
            position: 'absolute', top: 16, left: 36, right: 36,
            display: 'flex', justifyContent: 'space-between',
            fontFamily: T.body, fontSize: 10, letterSpacing: 2, color: T.burg, fontWeight: 600,
          }}>
            <span>COOKBOOK — VOL. IV, ISS. 02</span>
            <span>MAY · MMXXVI</span>
            <span>P. 008</span>
          </div>

          {/* Left page */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', paddingTop: 24 }}>
            <div>
              <div style={{
                fontFamily: T.body, fontSize: 11, letterSpacing: 3,
                color: T.ochre, fontWeight: 600, textTransform: 'uppercase', marginBottom: 14,
              }}>Chapter One — Завтрак</div>
              <h2 style={{
                fontFamily: T.display, fontWeight: 400, fontSize: 92, lineHeight: 0.9,
                color: T.burg, margin: 0, letterSpacing: -2.5,
              }}>
                Готовлю<br/>для тех,<br/>
                <em style={{ fontStyle: 'italic', color: T.ochre }}>кого&nbsp;люблю.</em>
              </h2>
              <p style={{ marginTop: 26, fontSize: 14, lineHeight: 1.75, color: T.ink, maxWidth: 380, columnCount: 1 }}>
                <span style={{
                  float: 'left', fontFamily: T.display, fontSize: 80, lineHeight: 0.85,
                  color: T.burg, paddingRight: 10, paddingTop: 6, fontWeight: 400,
                }}>Л</span>
                ичная книга рецептов. Не для всех — для своих. Каждый рецепт здесь с историей, с воспоминанием и с AI-нутрициологом, который считает КБЖУ за тебя. Создавалось медленно и с душой.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
              <button style={{
                background: T.burg, color: T.paper, border: 0,
                padding: '14px 28px', borderRadius: 0,
                fontFamily: T.body, fontWeight: 600, fontSize: 12,
                letterSpacing: 1.6, textTransform: 'uppercase', cursor: 'pointer',
              }}>Открыть номер</button>
              <span style={{ fontFamily: T.display, fontStyle: 'italic', fontSize: 22, color: T.olive }}>
                42 страницы внутри
              </span>
            </div>
          </div>

          {/* Right page — full bleed photo + caption */}
          <div style={{ position: 'relative', borderRadius: 2, overflow: 'hidden' }}>
            <HeroPhoto />
            {/* Ochre swatch overlay */}
            <div style={{
              position: 'absolute', top: 20, left: 20,
              width: 100, height: 100, background: T.ochre,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexDirection: 'column',
            }}>
              <span style={{ fontFamily: T.display, fontSize: 40, lineHeight: 1, color: T.burg, fontWeight: 400 }}>01</span>
              <span style={{ fontFamily: T.body, fontSize: 9, letterSpacing: 1.8, color: T.burg, fontWeight: 600, marginTop: 2 }}>RECIPE</span>
            </div>
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'linear-gradient(180deg, transparent, rgba(21,17,13,.7))',
              padding: '60px 24px 22px', color: T.paper,
            }}>
              <div style={{ fontFamily: T.body, fontSize: 10, letterSpacing: 2.4, fontWeight: 600, marginBottom: 6, opacity: .85 }}>
                FIG. I — ПОРТРЕТ БЛЮДА
              </div>
              <div style={{ fontFamily: T.display, fontStyle: 'italic', fontSize: 28, lineHeight: 1.15 }}>
                Круассан с бри, сливой и фисташковой пастой
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pull quote */}
      <div style={{
        borderTop: `2px solid ${T.burg}`, borderBottom: `2px solid ${T.burg}`,
        padding: '36px 0',
        display: 'grid', gridTemplateColumns: '80px 1fr 80px', alignItems: 'center', gap: 40,
      }}>
        <div style={{ fontFamily: T.display, fontSize: 88, color: T.ochre, lineHeight: 0.7, fontWeight: 400 }}>“</div>
        <div style={{ fontFamily: T.display, fontStyle: 'italic', fontSize: 42, lineHeight: 1.1, color: T.burg, letterSpacing: -0.5, textAlign: 'center' }}>
          Еда — это не топливо. Это&nbsp;воспоминания, любовь и&nbsp;забота.
        </div>
        <div style={{ fontFamily: T.display, fontSize: 88, color: T.ochre, lineHeight: 0.7, fontWeight: 400, textAlign: 'right' }}>”</div>
      </div>

      {/* Recipe cards as magazine entries */}
      <div>
        <SectionLabel font={T.body} style={{ color: T.burg, fontWeight: 600 }}>СОДЕРЖАНИЕ — ВЫПУСК</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr', gap: 22 }}>
          {[
            { n: 'I',   t: 'Круассан с бри и сливой', cat: 'Завтрак',  kcal: 425, mins: 15, tone: 'warm',  hero: true },
            { n: 'II',  t: 'Тыква с тахини',          cat: 'Ужин',     kcal: 310, mins: 35, tone: 'olive' },
            { n: 'III', t: 'Творожник с инжиром',     cat: 'Десерт',   kcal: 280, mins: 50, tone: 'mauve' },
          ].map((r) => (
            <div key={r.n} style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: 280, marginBottom: 14, overflow: 'hidden', position: 'relative' }}>
                {r.hero ? <HeroPhoto /> : <Placeholder w="100%" h="100%" tone={r.tone} label="ФОТО · top-down" />}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                <span style={{ fontFamily: T.display, fontStyle: 'italic', fontSize: 48, lineHeight: 1, color: T.ochre, fontWeight: 400 }}>
                  {r.n}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: T.body, fontSize: 10, letterSpacing: 2, color: T.burg, fontWeight: 600, textTransform: 'uppercase' }}>
                    {r.cat}
                  </div>
                  <div style={{ fontFamily: T.display, fontSize: 24, lineHeight: 1.1, color: T.ink, marginTop: 4 }}>
                    {r.t}
                  </div>
                </div>
              </div>
              <div style={{
                borderTop: `1px solid ${T.rule}`, marginTop: 12, paddingTop: 10,
                display: 'flex', justifyContent: 'space-between',
                fontFamily: T.body, fontSize: 11, letterSpacing: 1.4, color: T.soft, fontWeight: 600, textTransform: 'uppercase',
              }}>
                <span>{r.mins} мин</span>
                <span style={{ color: T.ochre }}>{r.kcal} ккал</span>
                <span>P. {String(8 + Math.floor(Math.random() * 30)).padStart(3, '0')}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        borderTop: `1px solid ${T.rule}`, paddingTop: 18,
        display: 'flex', justifyContent: 'space-between',
        fontFamily: T.body, fontSize: 11, letterSpacing: 1.6, color: T.soft, fontWeight: 600, textTransform: 'uppercase',
      }}>
        <span>Подходит: Анна · бренд читается мгновенно · виральный потенциал в Instagram</span>
        <span style={{ color: T.burg }}>Risk: тяжелее переводить в мобильную версию</span>
      </div>
    </div>
  );
};

window.D4 = D4;

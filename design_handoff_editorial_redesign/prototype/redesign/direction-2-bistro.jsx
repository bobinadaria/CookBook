// Direction 2 — Warm Domestic: "Воскресная книга"
// Evolution of the current style — richer, more confident, more handcrafted.
// References: Ottolenghi, Smitten Kitchen, Magnolia Journal.

const D2 = () => {
  const T = {
    cream:   '#FAF4EA',
    sand:    '#ECDEC4',
    sandDk:  '#D8C7A4',
    peach:   '#D97A4D',
    olive:   '#7B8A5F',
    plum:    '#5A2A28',
    ink:     '#2A1F18',
    soft:    'rgba(42,31,24,.55)',
    rule:    'rgba(42,31,24,.14)',
    serif:   '"Cormorant Garamond", Georgia, serif',
    hand:    '"Caveat", cursive',
    sans:    '"Plus Jakarta Sans", system-ui, sans-serif',
  };

  return (
    <div style={{
      width: '100%', height: '100%', background: T.cream, color: T.ink,
      fontFamily: T.sans, fontSize: 14, lineHeight: 1.5,
      padding: '56px 60px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 44,
    }}>
      {/* Heading */}
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 40 }}>
        <div>
          <div style={{ fontFamily: T.hand, fontSize: 26, color: T.peach, lineHeight: 1, marginBottom: 4 }}>
            № 02 · направление
          </div>
          <h1 style={{
            fontFamily: T.serif, fontWeight: 400, fontStyle: 'italic',
            fontSize: 92, lineHeight: 0.92, letterSpacing: -1.5, margin: 0,
            color: T.plum,
          }}>Воскресная&nbsp;книга</h1>
          <p style={{ margin: '18px 0 0', fontSize: 14, color: T.soft, maxWidth: 560 }}>
            Эволюция текущего стиля. Богаче, теплее, увереннее. Глубокая слива как «голос автора», горчично-сэйдж как пара. Рукописные пометки на фото и подписях — как в кухонной книге, доставшейся от бабушки. Референсы — Ottolenghi, Smitten&nbsp;Kitchen.
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
          <span style={{ fontFamily: T.hand, fontSize: 32, color: T.olive, lineHeight: 1 }}>уютно</span>
          <span style={{ fontFamily: T.hand, fontSize: 32, color: T.peach, lineHeight: 1 }}>лично</span>
          <span style={{ fontFamily: T.hand, fontSize: 32, color: T.plum,  lineHeight: 1 }}>вкусно</span>
        </div>
      </header>

      <div style={{ height: 1, background: T.rule }} />

      {/* Palette + Type */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 56 }}>
        <div>
          <SectionLabel>Палитра</SectionLabel>
          <div style={{ display: 'flex', gap: 18 }}>
            <Swatch name="Cream" hex={T.cream} value="#FAF4EA" />
            <Swatch name="Sand"  hex={T.sand}  value="#ECDEC4" />
            <Swatch name="Peach" hex={T.peach} value="#D97A4D" />
            <Swatch name="Olive" hex={T.olive} value="#7B8A5F" />
            <Swatch name="Plum"  hex={T.plum}  value="#5A2A28" />
          </div>
          <div style={{ marginTop: 14, fontFamily: T.hand, fontSize: 18, color: T.soft, lineHeight: 1.5 }}>
            глубокая слива — для заголовков и якорей. <br /> остальное греет, не кричит.
          </div>
        </div>

        <div>
          <SectionLabel>Типографика</SectionLabel>
          <div style={{ borderTop: `1px solid ${T.rule}`, paddingTop: 18 }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontWeight: 400, fontSize: 60, lineHeight: 1, color: T.plum }}>
                Cormorant Italic
              </div>
              <div style={{ fontSize: 11, color: T.soft, marginTop: 6 }}>заголовки · большие цифры · цитаты</div>
            </div>
            <div style={{ borderTop: `1px solid ${T.rule}`, paddingTop: 14, marginBottom: 14 }}>
              <div style={{ fontFamily: T.hand, fontSize: 36, color: T.peach, lineHeight: 1 }}>
                Caveat — личные пометки
              </div>
              <div style={{ fontSize: 11, color: T.soft, marginTop: 6 }}>1–4 слова. метки на фото. подписи разделов.</div>
            </div>
            <div style={{ borderTop: `1px solid ${T.rule}`, paddingTop: 14 }}>
              <div style={{ fontFamily: T.sans, fontWeight: 500, fontSize: 18 }}>Plus Jakarta — для всего остального</div>
              <div style={{ fontSize: 11, color: T.soft, marginTop: 6 }}>body, кнопки, навигация, UI</div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div>
        <SectionLabel>Главная — hero (асимметричная сетка)</SectionLabel>
        <div style={{
          background: T.sand, borderRadius: 28, padding: 36,
          display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32, alignItems: 'stretch',
          minHeight: 520,
        }}>
          {/* Photo big */}
          <div style={{ position: 'relative', borderRadius: 22, overflow: 'hidden', minHeight: 460 }}>
            <HeroPhoto />
            {/* Handwritten tag floating on photo */}
            <div style={{
              position: 'absolute', top: 24, right: 24,
              transform: 'rotate(-4deg)',
              fontFamily: T.hand, fontSize: 28, color: T.cream,
              background: T.peach, padding: '8px 18px',
              borderRadius: 999, boxShadow: '0 6px 20px rgba(42,31,24,.25)',
            }}>любимое</div>
            {/* Caption strip */}
            <div style={{
              position: 'absolute', bottom: 24, left: 24, right: 24,
              background: 'rgba(250,244,234,.92)', padding: '14px 20px', borderRadius: 14,
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
            }}>
              <span style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 20, color: T.plum }}>
                круассан с бри и сливой
              </span>
              <span style={{ fontFamily: T.hand, fontSize: 18, color: T.peach }}>15 мин</span>
            </div>
          </div>

          {/* Right column: text + small recipe pinned */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '4px 4px 4px 12px' }}>
            <div>
              <div style={{ fontFamily: T.hand, fontSize: 28, color: T.peach, marginBottom: 4 }}>добро пожаловать</div>
              <h2 style={{
                fontFamily: T.serif, fontWeight: 400, fontSize: 64, lineHeight: 0.98,
                color: T.plum, margin: 0, letterSpacing: -1,
              }}>
                Я готовлю<br />
                для тех,<br />
                кого <em style={{ fontStyle: 'italic', color: T.peach }}>люблю</em>
              </h2>
              <p style={{ marginTop: 22, fontSize: 14, lineHeight: 1.65, color: T.soft, maxWidth: 360 }}>
                Личная книга рецептов. Не для всех — для своих. С AI-нутрициологом, который считает калории и пишет твою историю с тобой.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
              <button style={{
                background: T.plum, color: T.cream, border: 0, padding: '14px 26px',
                borderRadius: 999, fontFamily: T.sans, fontWeight: 500, fontSize: 13,
                cursor: 'pointer', letterSpacing: 0.2,
              }}>Открыть книгу →</button>
              <span style={{ fontFamily: T.hand, fontSize: 22, color: T.olive, transform: 'rotate(-2deg)' }}>
                ↗ 42 истории внутри
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recipe cards row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 18 }}>
        {[
          { tone: 'warm',  cat: 'завтрак', title: 'Круассан с бри и сливой', kcal: 425, mins: 15, hero: true,  fav: true },
          { tone: 'olive', cat: 'ужин',    title: 'Тыква с тахини и тимьяном', kcal: 310, mins: 35, hero: false, fav: false },
          { tone: 'cream', cat: 'десерт',  title: 'Творожник с инжиром',     kcal: 280, mins: 50, hero: false, fav: true  },
        ].map((r, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', height: 260 }}>
              {r.hero ? <HeroPhoto /> : <Placeholder w="100%" h="100%" tone={r.tone} label="ФОТО · top-down" />}
              {r.fav && (
                <div style={{
                  position: 'absolute', top: 12, left: 12,
                  width: 32, height: 32, borderRadius: 999, background: T.cream,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(42,31,24,.15)',
                }}>
                  <span style={{ color: T.peach, fontSize: 16, lineHeight: 1 }}>♥</span>
                </div>
              )}
              <div style={{
                position: 'absolute', bottom: 12, right: 12,
                fontFamily: T.hand, fontSize: 18, color: T.cream,
                background: 'rgba(42,31,24,.6)', padding: '4px 12px', borderRadius: 999,
              }}>{r.mins} мин</div>
            </div>
            <div>
              <div style={{ fontFamily: T.hand, fontSize: 16, color: T.olive }}>{r.cat}</div>
              <div style={{ fontFamily: T.serif, fontStyle: 'italic', fontSize: 22, color: T.plum, lineHeight: 1.2 }}>
                {r.title}
              </div>
              <div style={{ marginTop: 6, fontSize: 12, color: T.soft, display: 'flex', gap: 10 }}>
                <span>{r.kcal} ккал</span>·<span>2 порции</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div style={{
        borderTop: `1px solid ${T.rule}`, paddingTop: 18,
        display: 'flex', justifyContent: 'space-between',
        fontSize: 12, color: T.soft,
      }}>
        <span>Подходит: всем трём персонам · читается как «книга», не как app</span>
        <span style={{ fontFamily: T.hand, fontSize: 16, color: T.peach }}>безопасный выбор — но не самый смелый</span>
      </div>
    </div>
  );
};

window.D2 = D2;

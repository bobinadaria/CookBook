// Direction 3 — Modern App: "Студия"
// References: Linear, Notion, Headspace, Arc browser, Things.
// Mood: software-first, dense, tabular nutrition, "Notion of God" for Anna persona.

const D3 = () => {
  const T = {
    linen:    '#F7F4EF',
    fog:      '#EDE9E1',
    card:     '#FFFFFF',
    stone:    '#2A2722',
    mute:     '#6E665B',
    rule:     '#E2DDD2',
    sage:     '#6F8865',
    persimmon:'#C9714A',
    serif:    '"Bricolage Grotesque", system-ui, sans-serif',
    sans:     '"Manrope", system-ui, sans-serif',
    mono:     '"Geist Mono", "JetBrains Mono", ui-monospace, monospace',
  };

  return (
    <div style={{
      width: '100%', height: '100%', background: T.linen, color: T.stone,
      fontFamily: T.sans, fontSize: 14, lineHeight: 1.5,
      padding: '56px 60px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 44,
    }}>
      {/* Heading */}
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 40 }}>
        <div>
          <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 1.4, color: T.sage, marginBottom: 12 }}>
            03 / DIRECTION
          </div>
          <h1 style={{
            fontFamily: T.serif, fontWeight: 600, fontSize: 78, lineHeight: 0.95,
            letterSpacing: -2.5, margin: 0,
          }}>Студия<span style={{ color: T.persimmon }}>.</span></h1>
          <p style={{ margin: '18px 0 0', fontSize: 14, color: T.mute, maxWidth: 560 }}>
            Software-first. Книга превращается в инструмент: плотные карточки, табличные данные, чёткая сетка, AI-нутри как первый класс UI. Это «Notion от Бога» для Анны-продакта. Премиум читается через продуктовое мастерство, а не через декоративность.
          </p>
        </div>
        <div style={{
          fontFamily: T.mono, fontSize: 10, letterSpacing: 1.2, color: T.mute,
          border: `1px solid ${T.rule}`, padding: '8px 12px', borderRadius: 6,
          background: T.card,
        }}>v0.3 · PRIVATE BETA</div>
      </header>

      <div style={{ height: 1, background: T.rule }} />

      {/* Palette + Type */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 56 }}>
        <div>
          <SectionLabel font={T.mono}>Палитра</SectionLabel>
          <div style={{ display: 'flex', gap: 18 }}>
            <Swatch name="Linen"     hex={T.linen}     value="#F7F4EF" />
            <Swatch name="Fog"       hex={T.fog}       value="#EDE9E1" />
            <Swatch name="Stone"     hex={T.stone}     value="#2A2722" />
            <Swatch name="Sage"      hex={T.sage}      value="#6F8865" />
            <Swatch name="Persimmon" hex={T.persimmon} value="#C9714A" />
          </div>
          <div style={{ marginTop: 14, fontFamily: T.mono, fontSize: 10, color: T.mute, lineHeight: 1.7 }}>
            почти монохром. sage — здоровое/safe. persimmon — действие/нажатие.
          </div>
        </div>

        <div>
          <SectionLabel font={T.mono}>Типографика</SectionLabel>
          <div style={{ borderTop: `1px solid ${T.rule}`, paddingTop: 18 }}>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: T.serif, fontWeight: 600, fontSize: 52, lineHeight: 1, letterSpacing: -1.6 }}>
                Bricolage Grotesque
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 10, color: T.mute, marginTop: 4 }}>600 / display</div>
            </div>
            <div style={{ borderTop: `1px solid ${T.rule}`, paddingTop: 14, marginBottom: 14 }}>
              <div style={{ fontFamily: T.sans, fontWeight: 500, fontSize: 22 }}>
                Manrope — body, навигация, кнопки
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 10, color: T.mute, marginTop: 4 }}>400 / 500 / 600</div>
            </div>
            <div style={{ borderTop: `1px solid ${T.rule}`, paddingTop: 14 }}>
              <div style={{ fontFamily: T.mono, fontSize: 16, color: T.persimmon }}>
                Geist Mono · 425 kcal · 18g protein · 24g fat
              </div>
              <div style={{ fontFamily: T.mono, fontSize: 10, color: T.mute, marginTop: 4 }}>все числа · теги · meta</div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero — looks like app dashboard */}
      <div>
        <SectionLabel font={T.mono}>Главная — приложение, не сайт</SectionLabel>
        <div style={{
          background: T.card, border: `1px solid ${T.rule}`, borderRadius: 16,
          padding: 28, display: 'grid', gridTemplateColumns: '220px 1fr', gap: 28,
        }}>
          {/* Sidebar */}
          <aside style={{
            background: T.linen, borderRadius: 12, padding: 18,
            display: 'flex', flexDirection: 'column', gap: 4,
            fontSize: 13,
          }}>
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4, color: T.mute, marginBottom: 12, padding: '0 8px' }}>
              МОЯ КНИГА
            </div>
            {['◆ Главная', '▤ Все рецепты', '♡ Избранное', '⌖ Цели КБЖУ', '⊞ Меню недели'].map((t, i) => (
              <div key={i} style={{
                padding: '8px 10px', borderRadius: 8,
                background: i === 0 ? T.fog : 'transparent',
                color: i === 0 ? T.stone : T.mute,
                fontWeight: i === 0 ? 500 : 400,
                cursor: 'pointer',
              }}>{t}</div>
            ))}
            <div style={{ height: 1, background: T.rule, margin: '12px 8px' }} />
            <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4, color: T.mute, marginBottom: 8, padding: '0 8px' }}>
              КАТЕГОРИИ
            </div>
            {['Завтрак · 8', 'Обед · 12', 'Ужин · 14', 'Десерт · 6'].map((c, i) => (
              <div key={i} style={{ padding: '6px 10px', fontSize: 12, color: T.mute, cursor: 'pointer' }}>{c}</div>
            ))}
            <div style={{ marginTop: 'auto', padding: '12px 10px 0', borderTop: `1px solid ${T.rule}`, marginTop: 14 }}>
              <div style={{ fontFamily: T.mono, fontSize: 10, color: T.sage, marginBottom: 4 }}>● PREMIUM</div>
              <div style={{ fontSize: 12, color: T.mute }}>безлимит AI · €7.90/мес</div>
            </div>
          </aside>

          {/* Main panel */}
          <div>
            {/* Greet + search */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 22 }}>
              <div>
                <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4, color: T.mute, marginBottom: 4 }}>
                  ВТОРНИК · 20 МАЯ
                </div>
                <h3 style={{
                  fontFamily: T.serif, fontWeight: 600, fontSize: 36, lineHeight: 1, letterSpacing: -1, margin: 0,
                }}>Доброе утро, Анна.</h3>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: T.linen, padding: '8px 14px', borderRadius: 8,
                border: `1px solid ${T.rule}`, minWidth: 240,
              }}>
                <span style={{ color: T.mute }}>⌕</span>
                <span style={{ color: T.mute, fontSize: 13 }}>Поиск или ⌘K</span>
              </div>
            </div>

            {/* Stat strip */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 22 }}>
              {[
                ['РЕЦЕПТОВ',   '24',  '/ 30 лимит'],
                ['КБЖУ AI',    '1340', 'ккал сегодня'],
                ['ИЗБРАННОЕ',  '8',   'рецептов'],
                ['СТРИК',      '12',  'дней подряд'],
              ].map(([l, n, s]) => (
                <div key={l} style={{ background: T.linen, padding: '14px 16px', borderRadius: 10 }}>
                  <div style={{ fontFamily: T.mono, fontSize: 9, letterSpacing: 1.4, color: T.mute }}>{l}</div>
                  <div style={{ fontFamily: T.serif, fontWeight: 600, fontSize: 30, color: T.stone, marginTop: 2 }}>{n}</div>
                  <div style={{ fontFamily: T.mono, fontSize: 10, color: T.mute, marginTop: 2 }}>{s}</div>
                </div>
              ))}
            </div>

            {/* Two main cards: one feature one secondary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
              <div style={{ borderRadius: 12, overflow: 'hidden', position: 'relative', minHeight: 220 }}>
                <HeroPhoto />
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,.45) 100%)',
                }} />
                <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16, color: '#fff' }}>
                  <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4, opacity: .85, marginBottom: 4 }}>
                    ПРОДОЛЖИТЬ ЧИТАТЬ
                  </div>
                  <div style={{ fontFamily: T.serif, fontWeight: 600, fontSize: 24, lineHeight: 1.15, letterSpacing: -0.5 }}>
                    Круассан с бри и сливой
                  </div>
                  <div style={{ fontFamily: T.mono, fontSize: 11, opacity: .85, marginTop: 4 }}>
                    425 KCAL · 15 МИН · 2 ПОРЦИИ
                  </div>
                </div>
              </div>

              <div style={{
                background: T.linen, borderRadius: 12, padding: 18,
                display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4, color: T.sage }}>● AI · NUTRITIONIST</div>
                <div style={{ fontFamily: T.serif, fontWeight: 600, fontSize: 22, lineHeight: 1.1, letterSpacing: -0.6 }}>
                  Посчитать КБЖУ для нового рецепта
                </div>
                <div style={{ fontSize: 12, color: T.mute, lineHeight: 1.5 }}>
                  Вставь ингредиенты — мы посчитаем точно (±5%) через USDA, без галлюцинаций.
                </div>
                <button style={{
                  marginTop: 'auto', background: T.stone, color: T.linen, border: 0,
                  padding: '10px 14px', borderRadius: 8,
                  fontFamily: T.sans, fontWeight: 500, fontSize: 13, cursor: 'pointer',
                }}>Открыть калькулятор →</button>
                <div style={{ fontFamily: T.mono, fontSize: 10, color: T.mute }}>осталось 8 / 10 в этом месяце</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recipe row + nutrition table */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
        {/* Recipe list */}
        <div>
          <SectionLabel font={T.mono}>Карточки в списке</SectionLabel>
          <div style={{ background: T.card, border: `1px solid ${T.rule}`, borderRadius: 12, overflow: 'hidden' }}>
            {[
              { t: 'Круассан с бри и сливой', cat: 'Завтрак', kcal: 425, mins: 15, hero: true },
              { t: 'Тыква с тахини и тимьяном', cat: 'Ужин',   kcal: 310, mins: 35 },
              { t: 'Творожник с инжиром',     cat: 'Десерт',  kcal: 280, mins: 50 },
              { t: 'Греческий салат',         cat: 'Обед',    kcal: 220, mins: 12 },
            ].map((r, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '52px 1fr auto auto', alignItems: 'center', gap: 14,
                padding: '12px 14px', borderTop: i === 0 ? 'none' : `1px solid ${T.rule}`,
              }}>
                <div style={{ width: 52, height: 52, borderRadius: 8, overflow: 'hidden' }}>
                  {r.hero ? <HeroPhoto /> : <Placeholder w="100%" h="100%" tone={['warm','olive','mauve','cream'][i % 4]} label="" />}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{r.t}</div>
                  <div style={{ fontFamily: T.mono, fontSize: 11, color: T.mute, marginTop: 2 }}>{r.cat}</div>
                </div>
                <div style={{ fontFamily: T.mono, fontSize: 12, color: T.persimmon }}>{r.kcal} kcal</div>
                <div style={{ fontFamily: T.mono, fontSize: 12, color: T.mute, width: 56, textAlign: 'right' }}>{r.mins} мин</div>
              </div>
            ))}
          </div>
        </div>

        {/* Nutrition table — first-class */}
        <div>
          <SectionLabel font={T.mono}>КБЖУ — табличная подача</SectionLabel>
          <div style={{ background: T.card, border: `1px solid ${T.rule}`, borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 16 }}>
              <div style={{ fontFamily: T.serif, fontWeight: 600, fontSize: 22, letterSpacing: -0.6 }}>На порцию</div>
              <div style={{ fontFamily: T.mono, fontSize: 10, color: T.sage, letterSpacing: 1.2 }}>● AI · USDA · ±5%</div>
            </div>

            {/* Bar chart row */}
            <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 70px', gap: 12, alignItems: 'center', marginBottom: 8 }}>
              {[
                ['Белки',    18,  '36g', '#6F8865', 60],
                ['Жиры',     24,  '24g', '#C9714A', 80],
                ['Углеводы', 34,  '34g', '#8A7B5C', 45],
              ].map(([k, v, txt, c, pct]) => (
                <React.Fragment key={k}>
                  <div style={{ fontSize: 12, color: T.mute }}>{k}</div>
                  <div style={{ height: 8, background: T.fog, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: c }} />
                  </div>
                  <div style={{ fontFamily: T.mono, fontSize: 12, textAlign: 'right' }}>{txt}</div>
                </React.Fragment>
              ))}
            </div>

            <div style={{ borderTop: `1px solid ${T.rule}`, marginTop: 14, paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div>
                <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4, color: T.mute }}>ИТОГО</div>
                <div style={{ fontFamily: T.serif, fontWeight: 600, fontSize: 40, lineHeight: 1, color: T.persimmon, letterSpacing: -1 }}>425 <span style={{ fontFamily: T.mono, fontSize: 12, color: T.mute, letterSpacing: 1 }}>KCAL</span></div>
              </div>
              <div style={{
                background: T.linen, borderRadius: 10, padding: '8px 12px',
                fontFamily: T.mono, fontSize: 11, color: T.mute, lineHeight: 1.6,
              }}>
                цель: 1800 kcal/день<br/>
                <span style={{ color: T.sage }}>● 24% дневной нормы</span>
              </div>
            </div>

            <div style={{ marginTop: 14, fontFamily: T.mono, fontSize: 10, color: T.mute, lineHeight: 1.6 }}>
              ※ Mifflin-St Jeor + USDA. Не заменяет диетолога.
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        borderTop: `1px solid ${T.rule}`, paddingTop: 18,
        display: 'flex', justifyContent: 'space-between',
        fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4, color: T.mute,
      }}>
        <span>ПОДХОДИТ: АННА (PM, BERLIN) · КАТЯ (B2B) · ПРЕМИУМ ЧИТАЕТСЯ ЧЕРЕЗ КАЧЕСТВО UX</span>
        <span>RISK: «КНИГА» ОЩУЩАЕТСЯ КАК ПРИЛОЖЕНИЕ — НЕ ВСЕМ ПОНРАВИТСЯ</span>
      </div>
    </div>
  );
};

window.D3 = D3;

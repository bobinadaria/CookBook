// Direction 1 — Editorial Minimal: "Тихая кухня"
// References: Cereal Magazine, Kinfolk, NYT Cooking premium
// Mood: quiet, generous whitespace, single restrained accent, mono details.

const D1 = () => {
  const T = {
    bone:   '#F5F1EA',
    paper:  '#FAF7F1',
    ink:    '#1A1815',
    soft:   'rgba(26,24,21,.55)',
    terra:  '#B05A35',
    sage:   '#A8AE94',
    rule:   'rgba(26,24,21,.12)',
    serif:  '"Newsreader", "Cormorant Garamond", Georgia, serif',
    sans:   '"Plus Jakarta Sans", system-ui, sans-serif',
    mono:   '"JetBrains Mono", ui-monospace, monospace',
  };

  return (
    <div style={{
      width: '100%', height: '100%', background: T.bone, color: T.ink,
      fontFamily: T.sans, fontSize: 14, lineHeight: 1.5,
      padding: '56px 60px', boxSizing: 'border-box',
      display: 'flex', flexDirection: 'column', gap: 48,
    }}>
      {/* ── Heading ────────────────────────────────────────────── */}
      <header style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 40 }}>
        <div>
          <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 2, color: T.terra, marginBottom: 14 }}>
            № 01 · НАПРАВЛЕНИЕ
          </div>
          <h1 style={{
            fontFamily: T.serif, fontWeight: 300, fontStyle: 'italic',
            fontSize: 84, lineHeight: 0.95, letterSpacing: -1, margin: 0,
          }}>Тихая&nbsp;кухня</h1>
          <p style={{
            margin: '18px 0 0', fontSize: 14, color: T.soft, maxWidth: 540,
          }}>Editorial-минимализм. Много воздуха, одна тёплая краска (терракота), сдержанный sage. Тон — личный, журнальный, без декоративности. Референсы — Cereal, Kinfolk, NYT&nbsp;Cooking.</p>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4, color: T.soft }}>
          <span>EDITORIAL</span><span>·</span><span>QUIET</span><span>·</span><span>PERSONAL</span>
        </div>
      </header>

      <div style={{ height: 1, background: T.rule }} />

      {/* ── Palette + Type ──────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 56 }}>
        <div>
          <SectionLabel font={T.mono}>Палитра</SectionLabel>
          <div style={{ display: 'flex', gap: 22 }}>
            <Swatch name="Bone"      hex={T.bone}  value="#F5F1EA" />
            <Swatch name="Paper"     hex={T.paper} value="#FAF7F1" />
            <Swatch name="Ink"       hex={T.ink}   value="#1A1815" />
            <Swatch name="Terracotta" hex={T.terra} value="#B05A35" />
            <Swatch name="Sage"      hex={T.sage}  value="#A8AE94" />
          </div>
          <div style={{ marginTop: 14, fontFamily: T.mono, fontSize: 10, color: T.soft, lineHeight: 1.7 }}>
            ONE warm accent. Sage — для иконок, статусов, не как фон.
          </div>
        </div>

        <div>
          <SectionLabel font={T.mono}>Типографика</SectionLabel>
          <div style={{ borderTop: `1px solid ${T.rule}`, paddingTop: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
              <span style={{ fontFamily: T.serif, fontStyle: 'italic', fontWeight: 300, fontSize: 56, lineHeight: 1 }}>
                Newsreader Italic
              </span>
              <span style={{ fontFamily: T.mono, fontSize: 10, color: T.soft }}>300 / italic / display</span>
            </div>
            <div style={{ borderTop: `1px solid ${T.rule}`, paddingTop: 14, marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: T.sans, fontWeight: 400, fontSize: 22, color: T.ink }}>
                Plus Jakarta Sans — body, UI, навигация
              </span>
              <span style={{ fontFamily: T.mono, fontSize: 10, color: T.soft }}>400 / 500 / body</span>
            </div>
            <div style={{ borderTop: `1px solid ${T.rule}`, paddingTop: 14, marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontFamily: T.mono, fontSize: 13, letterSpacing: 1.2, textTransform: 'uppercase', color: T.terra }}>
                JetBrains Mono · METADATA · 425 KCAL
              </span>
              <span style={{ fontFamily: T.mono, fontSize: 10, color: T.soft }}>mono / data</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Hero landing ────────────────────────────────────────── */}
      <div>
        <SectionLabel font={T.mono}>Главная — hero</SectionLabel>
        <div style={{
          background: T.paper, border: `1px solid ${T.rule}`, borderRadius: 4,
          display: 'grid', gridTemplateColumns: '1fr 1.15fr', minHeight: 520, overflow: 'hidden',
        }}>
          {/* Left: text */}
          <div style={{ padding: '64px 56px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.mono, fontSize: 10, letterSpacing: 1.6, color: T.soft }}>
              <span>COOKBOOK · ВЫПУСК 04</span>
              <span>МАЙ 2026</span>
            </div>
            <div>
              <div style={{ fontFamily: T.mono, fontSize: 11, letterSpacing: 2, color: T.terra, marginBottom: 22 }}>
                ЭССЕ
              </div>
              <h2 style={{
                fontFamily: T.serif, fontWeight: 300, fontSize: 72, lineHeight: 1.02, letterSpacing: -1.5, margin: 0,
              }}>
                Готовлю для тех,<br />
                <em style={{ fontStyle: 'italic', color: T.terra }}>кого люблю</em>
              </h2>
              <p style={{ marginTop: 28, fontSize: 15, lineHeight: 1.7, color: T.soft, maxWidth: 420 }}>
                Личная книга рецептов. Не для всех — для своих. Каждый рецепт здесь с историей и AI-нутрициологом, который считает КБЖУ за тебя.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <button style={{
                background: T.ink, color: T.paper, border: 0, padding: '14px 28px',
                fontFamily: T.sans, fontSize: 13, fontWeight: 500, letterSpacing: 0.2,
                borderRadius: 0, cursor: 'pointer',
              }}>Смотреть рецепты →</button>
              <span style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4, color: T.soft }}>
                42 РЕЦЕПТА · 6 КАТЕГОРИЙ
              </span>
            </div>
          </div>
          {/* Right: photo full-bleed */}
          <div style={{ position: 'relative' }}>
            <HeroPhoto />
            <div style={{
              position: 'absolute', bottom: 24, left: 24,
              fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4, color: '#FAF7F1',
              background: 'rgba(26,24,21,.45)', padding: '6px 10px', backdropFilter: 'blur(6px)',
            }}>FIG. 01 · КРУАССАН С БРИ</div>
          </div>
        </div>
      </div>

      {/* ── Components row ──────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32 }}>
        {/* Recipe card */}
        <div>
          <SectionLabel font={T.mono}>Карточка рецепта</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            {[
              { idx: '01', title: 'Круассан с бри и сливой', cat: 'ЗАВТРАК', kcal: '425', tone: 'warm' },
              { idx: '02', title: 'Запечённая тыква с тахини', cat: 'УЖИН',     kcal: '310', tone: 'cream' },
            ].map((r) => (
              <div key={r.idx} style={{ background: T.paper, border: `1px solid ${T.rule}` }}>
                <div style={{ height: 220, position: 'relative' }}>
                  {r.idx === '01' ? <HeroPhoto /> : <Placeholder w="100%" h="100%" tone={r.tone} label="FOOD · TOP-DOWN" />}
                </div>
                <div style={{ padding: '18px 20px 22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4, color: T.soft, marginBottom: 10 }}>
                    <span>№ {r.idx} · {r.cat}</span>
                    <span style={{ color: T.terra }}>{r.kcal} KCAL</span>
                  </div>
                  <div style={{ fontFamily: T.serif, fontSize: 22, lineHeight: 1.15, fontWeight: 400 }}>
                    {r.title}
                  </div>
                  <div style={{ height: 1, background: T.rule, margin: '14px 0' }} />
                  <div style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.2, color: T.soft, display: 'flex', justifyContent: 'space-between' }}>
                    <span>25 МИН</span><span>·</span><span>2 ПОРЦИИ</span><span>·</span><span style={{ color: T.terra }}>ЧИТАТЬ →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nutrition / detail */}
        <div>
          <SectionLabel font={T.mono}>Нутри-блок (Premium-крючок)</SectionLabel>
          <div style={{ background: T.paper, border: `1px solid ${T.rule}`, padding: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 22 }}>
              <span style={{ fontFamily: T.serif, fontStyle: 'italic', fontWeight: 300, fontSize: 28 }}>
                на порцию
              </span>
              <span style={{ fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4, color: T.sage }}>
                AI · USDA
              </span>
            </div>
            {[
              ['Калории',   '425', 'ккал',  '#B05A35'],
              ['Белки',     '18',  'г',    null],
              ['Жиры',      '24',  'г',    null],
              ['Углеводы',  '34',  'г',    null],
            ].map(([k, v, u, c]) => (
              <div key={k} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
                borderTop: `1px solid ${T.rule}`, padding: '14px 0',
              }}>
                <span style={{ fontFamily: T.sans, fontSize: 13, color: T.soft }}>{k}</span>
                <span>
                  <span style={{ fontFamily: T.serif, fontSize: 32, fontWeight: 300, color: c || T.ink }}>{v}</span>
                  <span style={{ fontFamily: T.mono, fontSize: 10, color: T.soft, marginLeft: 6, letterSpacing: 1 }}>{u}</span>
                </span>
              </div>
            ))}
            <div style={{ borderTop: `1px solid ${T.rule}`, marginTop: 4, paddingTop: 14, fontFamily: T.mono, fontSize: 10, color: T.soft, lineHeight: 1.6 }}>
              ※ Значения ориентировочные. Не заменяет консультацию диетолога.
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer note ─────────────────────────────────────────── */}
      <div style={{
        borderTop: `1px solid ${T.rule}`, paddingTop: 18,
        display: 'flex', justifyContent: 'space-between',
        fontFamily: T.mono, fontSize: 10, letterSpacing: 1.4, color: T.soft,
      }}>
        <span>ПОДХОДИТ: АННА (BERLIN, PM) · ПРЕМИУМ-ЭСТЕТИКА</span>
        <span>RISK: МОЖЕТ ОЩУЩАТЬСЯ ХОЛОДНО</span>
      </div>
    </div>
  );
};

window.D1 = D1;

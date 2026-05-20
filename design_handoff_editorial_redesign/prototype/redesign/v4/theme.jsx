// Direction 4 — shared theme tokens + magazine chrome (header, footer, primitives)

const THEME4 = {
  paper:    '#F2EDE3',
  crust:    '#E8DFCB',
  cream:    '#FAF6EC',
  burg:     '#4A1E1E',
  burgDk:   '#2F1212',
  ochre:    '#C99846',
  ochreDk:  '#A37A33',
  olive:    '#6B7B4F',
  ink:      '#15110D',
  soft:     'rgba(21,17,13,.62)',
  muted:    'rgba(21,17,13,.45)',
  rule:     'rgba(21,17,13,.18)',
  display:  '"Bodoni Moda", "Playfair Display", "Cormorant Garamond", serif',
  body:     '"Work Sans", system-ui, sans-serif',
};

const Eyebrow = ({ children, color, style = {} }) => (
  <div style={{
    fontFamily: THEME4.body, fontSize: 11, letterSpacing: 2.4,
    color: color || THEME4.burg, fontWeight: 600, textTransform: 'uppercase',
    ...style,
  }}>{children}</div>
);

const DropCap = ({ children, color }) => (
  <span style={{
    float: 'left', fontFamily: THEME4.display, fontSize: 92,
    lineHeight: 0.82, color: color || THEME4.burg,
    paddingRight: 14, paddingTop: 8, fontWeight: 400,
    fontStyle: 'normal',
  }}>{children}</span>
);

const Rule = ({ weight = 1, color, style = {} }) => (
  <div style={{ height: weight, background: color || THEME4.rule, ...style }} />
);

const PullQuote = ({ children, author }) => (
  <div style={{
    borderTop: `2px solid ${THEME4.burg}`, borderBottom: `2px solid ${THEME4.burg}`,
    padding: '40px 0', margin: '32px 0',
    display: 'grid', gridTemplateColumns: '60px 1fr 60px', alignItems: 'center', gap: 32,
  }}>
    <div style={{ fontFamily: THEME4.display, fontSize: 96, color: THEME4.ochre, lineHeight: 0.5, fontWeight: 400, textAlign: 'right' }}>“</div>
    <div style={{
      fontFamily: THEME4.display, fontStyle: 'italic', fontSize: 44,
      lineHeight: 1.15, color: THEME4.burg, letterSpacing: -0.5, textAlign: 'center', fontWeight: 400,
    }}>
      {children}
      {author && (
        <div style={{
          fontFamily: THEME4.body, fontStyle: 'normal', fontSize: 11,
          letterSpacing: 2.4, color: THEME4.soft, fontWeight: 600,
          textTransform: 'uppercase', marginTop: 22,
        }}>{author}</div>
      )}
    </div>
    <div style={{ fontFamily: THEME4.display, fontSize: 96, color: THEME4.ochre, lineHeight: 0.5, fontWeight: 400, textAlign: 'left' }}>”</div>
  </div>
);

const EditorialButton = ({ children, variant = 'solid', onClick, style = {} }) => {
  const variants = {
    solid:  { background: THEME4.burg,  color: THEME4.paper, border: 0 },
    ghost:  { background: 'transparent', color: THEME4.burg, border: `1.5px solid ${THEME4.burg}` },
    ochre:  { background: THEME4.ochre, color: THEME4.burg, border: 0 },
    paper:  { background: THEME4.paper, color: THEME4.burg, border: 0 },
  };
  return (
    <button onClick={onClick} style={{
      ...variants[variant],
      padding: '15px 28px', borderRadius: 0,
      fontFamily: THEME4.body, fontWeight: 600, fontSize: 12,
      letterSpacing: 1.8, textTransform: 'uppercase', cursor: 'pointer',
      ...style,
    }}>{children}</button>
  );
};

const NumberDial = ({ n, label }) => (
  <div style={{
    width: 88, height: 88, background: THEME4.ochre,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  }}>
    <span style={{ fontFamily: THEME4.display, fontSize: 38, lineHeight: 1, color: THEME4.burg, fontWeight: 400 }}>{n}</span>
    {label && (
      <span style={{ fontFamily: THEME4.body, fontSize: 9, letterSpacing: 1.6, color: THEME4.burg, fontWeight: 700, marginTop: 2, textTransform: 'uppercase' }}>{label}</span>
    )}
  </div>
);

const EditorialHeader = ({ brandName, page, onNav }) => {
  const navItems = [
    { key: 'home',    label: 'Обложка' },
    { key: 'recipes', label: 'Рецепты' },
    { key: 'recipe',  label: 'Эссе' },
    { key: 'pricing', label: 'Подписка' },
  ];
  return (
    <header style={{ background: THEME4.paper, borderBottom: `1px solid ${THEME4.rule}` }}>
      {/* Thin top strip */}
      <div style={{
        borderBottom: `1px solid ${THEME4.rule}`,
        padding: '8px 56px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        fontFamily: THEME4.body, fontSize: 10, letterSpacing: 2, color: THEME4.soft, fontWeight: 600, textTransform: 'uppercase',
      }}>
        <span>Vol. IV · Issue 02 — Май MMXXVI</span>
        <span style={{ display: 'flex', gap: 22 }}>
          <span style={{ cursor: 'pointer' }}>RU · EN</span>
          <span style={{ color: THEME4.burg, cursor: 'pointer' }}>Войти →</span>
        </span>
      </div>
      {/* Masthead row */}
      <div style={{
        padding: '36px 56px 22px',
        display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'end', gap: 20,
      }}>
        <span style={{ fontFamily: THEME4.body, fontSize: 11, letterSpacing: 2, color: THEME4.soft, fontWeight: 600, textTransform: 'uppercase', justifySelf: 'start' }}>
          Личная книга &nbsp;·&nbsp; AI-нутрициолог
        </span>
        <h1 onClick={() => onNav('home')} style={{
          fontFamily: THEME4.display, fontWeight: 400, fontStyle: 'italic',
          fontSize: 88, lineHeight: 0.9, letterSpacing: -2.5, margin: 0,
          color: THEME4.burg, cursor: 'pointer', textAlign: 'center', whiteSpace: 'nowrap',
        }}>{brandName}</h1>
        <span style={{ fontFamily: THEME4.body, fontSize: 11, letterSpacing: 2, color: THEME4.soft, fontWeight: 600, textTransform: 'uppercase', justifySelf: 'end' }}>
          42 рецепта &nbsp;·&nbsp; новый выпуск по воскресеньям
        </span>
      </div>
      {/* Nav row */}
      <nav style={{
        padding: '14px 56px',
        display: 'flex', justifyContent: 'center', gap: 56,
        borderTop: `1px solid ${THEME4.rule}`,
      }}>
        {navItems.map((it) => (
          <button key={it.key} onClick={() => onNav(it.key)} style={{
            background: 'transparent', border: 0, cursor: 'pointer',
            fontFamily: THEME4.body, fontSize: 12, letterSpacing: 2,
            color: page === it.key ? THEME4.burg : THEME4.soft,
            fontWeight: page === it.key ? 700 : 500,
            textTransform: 'uppercase', padding: '4px 0',
            borderBottom: page === it.key ? `2px solid ${THEME4.burg}` : '2px solid transparent',
          }}>{it.label}</button>
        ))}
      </nav>
    </header>
  );
};

const FooterCol = ({ title, items }) => (
  <div>
    <div style={{
      fontFamily: THEME4.body, fontSize: 10, letterSpacing: 2, color: THEME4.ochre,
      fontWeight: 700, textTransform: 'uppercase', marginBottom: 16,
    }}>{title}</div>
    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((it) => (
        <li key={it} style={{ fontSize: 13, color: 'rgba(242,237,227,.85)', cursor: 'pointer' }}>{it}</li>
      ))}
    </ul>
  </div>
);

const EditorialFooter = ({ brandName }) => (
  <footer style={{
    background: THEME4.burg, color: THEME4.paper,
    padding: '72px 56px 36px', marginTop: 80,
  }}>
    <div style={{
      display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 48,
      borderBottom: `1px solid rgba(242,237,227,.2)`, paddingBottom: 40,
    }}>
      <div>
        <h2 style={{
          fontFamily: THEME4.display, fontStyle: 'italic', fontWeight: 400,
          fontSize: 56, margin: 0, color: THEME4.ochre, letterSpacing: -1.2, lineHeight: 0.95,
        }}>{brandName}</h2>
        <p style={{ marginTop: 18, fontSize: 13, color: 'rgba(242,237,227,.78)', lineHeight: 1.75, maxWidth: 320 }}>
          Личная книга рецептов Дарьи Бобиной. Из Праги — двенадцатый год. С AI-нутрициологом, который считает калории точно — не врёт, не округляет.
        </p>
        <div style={{ marginTop: 22, display: 'flex', gap: 12 }}>
          <EditorialButton variant="ochre" style={{ padding: '12px 22px', fontSize: 11 }}>Получить выпуск</EditorialButton>
        </div>
      </div>
      <FooterCol title="Книга"    items={['Все рецепты', 'По главам', 'Колонка редактора', 'Об авторе']} />
      <FooterCol title="Premium"  items={['Что внутри', 'Цены', 'Lifetime · 50 мест', 'FAQ']} />
      <FooterCol title="Связь"    items={['Instagram', 'Telegram', 'Substack', 'hello@bydaria.kitchen']} />
    </div>
    <div style={{
      paddingTop: 26,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      fontFamily: THEME4.body, fontSize: 10, letterSpacing: 2, color: 'rgba(242,237,227,.55)', fontWeight: 600, textTransform: 'uppercase',
    }}>
      <span>© MMXXVI — Дарья Бобина · bydaria.kitchen · Все рецепты авторские</span>
      <span>Praha &middot; MMXXVI &middot; Politika soukromí &middot; Podmínky</span>
    </div>
  </footer>
);

Object.assign(window, {
  THEME4, Eyebrow, DropCap, Rule, PullQuote, EditorialButton,
  NumberDial, EditorialHeader, EditorialFooter,
});

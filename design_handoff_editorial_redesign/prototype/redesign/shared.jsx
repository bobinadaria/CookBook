// Shared helpers across direction artboards.

const Swatch = ({ name, hex, value, dark, big }) => (
  <div style={{
    display: 'flex', flexDirection: 'column', gap: 6, minWidth: 0,
  }}>
    <div style={{
      width: big ? 96 : 72, height: big ? 96 : 72,
      background: hex, borderRadius: 12,
      boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.05)',
    }} />
    <div style={{ fontSize: 11, lineHeight: 1.3, color: dark ? '#1A1815' : '#1A1815', fontWeight: 500 }}>{name}</div>
    <div style={{ fontSize: 10, lineHeight: 1.3, color: 'rgba(0,0,0,.45)', fontFamily: 'ui-monospace, "JetBrains Mono", monospace' }}>{value || hex}</div>
  </div>
);

// Generic striped placeholder for imagery slots — never invent food drawings.
const Placeholder = ({ label, w, h, tone = 'warm', radius = 0, style = {} }) => {
  const tones = {
    warm:  ['#E8DFD0', '#D8CDB8'],
    cool:  ['#DEDDD7', '#C9C8C0'],
    deep:  ['#3F2A22', '#523930'],
    cream: ['#F2EEE5', '#E5DFD0'],
    olive: ['#B5B097', '#9A9676'],
    mauve: ['#C9B4B0', '#B69995'],
  };
  const [a, b] = tones[tone] || tones.warm;
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      backgroundImage: `repeating-linear-gradient(135deg, ${a} 0 14px, ${b} 14px 28px)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      ...style,
    }}>
      <span style={{
        fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
        fontSize: 11, letterSpacing: 0.4,
        color: 'rgba(0,0,0,.55)',
        background: 'rgba(255,255,255,.7)',
        padding: '3px 8px', borderRadius: 4,
      }}>{label}</span>
    </div>
  );
};

// Use the real hero.png cropped/treated.
const HeroPhoto = ({ style = {}, filter = 'none' }) => (
  <div style={{
    width: '100%', height: '100%', overflow: 'hidden',
    backgroundImage: 'url(assets/hero.png)',
    backgroundSize: 'cover',
    backgroundPosition: 'center 40%',
    filter,
    ...style,
  }} />
);

const SectionLabel = ({ children, font, style = {} }) => (
  <div style={{
    fontFamily: font || 'ui-monospace, "JetBrains Mono", monospace',
    fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase',
    color: 'rgba(0,0,0,.5)', marginBottom: 10,
    ...style,
  }}>{children}</div>
);

Object.assign(window, { Swatch, Placeholder, HeroPhoto, SectionLabel });

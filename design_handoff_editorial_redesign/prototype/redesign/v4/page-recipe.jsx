// RECIPE detail page — Дашин стол / magazine spread
// Sections: meta header · hero photo · drop-cap story · ingredients/steps · КБЖУ · note · related

const PageRecipe = () => {
  const T = THEME4;

  return (
    <div style={{ background: T.paper, color: T.ink, fontFamily: T.body }}>

      {/* ── Recipe header strip ─────────────────────────────────────────── */}
      <section style={{ padding: '40px 56px 22px', maxWidth: 1320, margin: '0 auto' }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
          fontFamily: T.body, fontSize: 11, letterSpacing: 1.8, color: T.soft, fontWeight: 600, textTransform: 'uppercase',
          paddingBottom: 22, borderBottom: `1px solid ${T.rule}`,
        }}>
          <span style={{ cursor: 'pointer' }}>← Все рецепты</span>
          <span>Глава I · Завтрак &nbsp;·&nbsp; Recipe № 01 &nbsp;·&nbsp; P. 008</span>
          <span style={{ display: 'flex', gap: 22 }}>
            <span style={{ color: T.burg, cursor: 'pointer' }}>♡ в книгу</span>
            <span style={{ cursor: 'pointer' }}>Поделиться ↗</span>
          </span>
        </div>
      </section>

      {/* ── Title + meta ────────────────────────────────────────────────── */}
      <section style={{ padding: '20px 56px 40px', maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 56, alignItems: 'end' }}>
          <div>
            <Eyebrow color={T.ochreDk}>Воскресный завтрак · Recipe № 01</Eyebrow>
            <h2 style={{
              fontFamily: T.display, fontWeight: 400, fontSize: 96, lineHeight: 0.92,
              letterSpacing: -2.8, margin: '12px 0 0', color: T.burg,
            }}>
              Круассан<br/>с бри, сливой и<br/>
              <em style={{ fontStyle: 'italic', color: T.ochre }}>фисташковой пастой.</em>
            </h2>
          </div>
          <div>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16,
              borderTop: `2px solid ${T.burg}`, paddingTop: 22,
            }}>
              {[
                ['Время',   '15', 'мин'],
                ['Порций',  '2',  ''],
                ['Сложность', 'I', '/ III'],
                ['Калории', '425', 'ккал'],
              ].map(([l, n, u]) => (
                <div key={l}>
                  <Eyebrow style={{ color: T.soft, marginBottom: 4 }}>{l}</Eyebrow>
                  <span style={{ fontFamily: T.display, fontSize: 36, color: T.burg, lineHeight: 1, fontWeight: 400 }}>{n}</span>
                  <span style={{ fontFamily: T.body, fontSize: 11, color: T.soft, marginLeft: 6, letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 600 }}>{u}</span>
                </div>
              ))}
            </div>
            <div style={{
              marginTop: 22, fontFamily: T.body, fontSize: 11, letterSpacing: 1.6,
              color: T.soft, fontWeight: 600, textTransform: 'uppercase',
              display: 'flex', justifyContent: 'space-between',
            }}>
              <span>от Даши</span>
              <span style={{ color: T.olive }}>● Premium · AI-нутри</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Hero photo ──────────────────────────────────────────────────── */}
      <section style={{ padding: '0 56px', maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ position: 'relative', height: 580, overflow: 'hidden' }}>
          <HeroPhoto />
          {/* Caption strip */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(180deg, transparent, rgba(21,17,13,.65))',
            padding: '120px 32px 24px', color: T.paper,
          }}>
            <Eyebrow style={{ color: 'rgba(242,237,227,.85)' }}>Fig. I — На столе</Eyebrow>
            <div style={{ fontFamily: T.display, fontStyle: 'italic', fontSize: 22, lineHeight: 1.3, marginTop: 6 }}>
              Подаём ещё тёплым — бри должен немного течь.
            </div>
          </div>
        </div>
      </section>

      {/* ── Story (drop-cap, two-column) ────────────────────────────────── */}
      <section style={{ padding: '88px 56px 40px', maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 56, alignItems: 'start' }}>
          <div>
            <Eyebrow color={T.ochreDk}>История блюда</Eyebrow>
            <div style={{ marginTop: 14, fontFamily: T.display, fontStyle: 'italic', fontSize: 22, color: T.soft, lineHeight: 1.3 }}>
              «Я готовлю это, когда хочу, чтобы воскресенье началось медленно.»
            </div>
            <div style={{ marginTop: 18, fontFamily: T.body, fontSize: 11, letterSpacing: 1.6, color: T.soft, fontWeight: 600, textTransform: 'uppercase' }}>
              — Даша
            </div>
          </div>

          <div style={{ fontSize: 17, lineHeight: 1.85, color: T.ink, fontFamily: 'Newsreader, Georgia, serif', maxWidth: 760, columnCount: 2, columnGap: 36 }}>
            <p style={{ margin: 0 }}>
              <DropCap>В</DropCap>оскресное утро в Праге пахнет ленью — и этим круассаном. Бри подтаивает от тепла хлеба, слива даёт кислоту, фисташковая паста — текстуру и лёгкую солёность. Это не «здоровый завтрак» из инстаграма. Это завтрак, после которого ты сидишь ещё час, не вставая, и просто смотришь в окно.
            </p>
            <p>
              Беру самые обычные круассаны из соседней пекарни — главное, чтобы они были сегодняшние. Бри не дорогой, не выдержанный: молодой, мягкий, чтобы плавился, а не «играл нотами». Сливу — ту, что давно лежит в холодильнике и просит, чтобы её куда-нибудь приспособили.
            </p>
          </div>
        </div>
      </section>

      {/* ── Ingredients + Steps ─────────────────────────────────────────── */}
      <section style={{ padding: '40px 56px 80px', maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.6fr', gap: 56, alignItems: 'start' }}>
          {/* Ingredients */}
          <aside style={{ position: 'sticky', top: 24, background: T.crust, padding: '32px 28px' }}>
            <Eyebrow color={T.burg}>Состав</Eyebrow>
            <h3 style={{ fontFamily: T.display, fontStyle: 'italic', fontSize: 36, color: T.burg, margin: '8px 0 24px', letterSpacing: -1, fontWeight: 400 }}>
              на 2 порции
            </h3>
            {[
              { qty: '2',     unit: 'шт',  name: 'круассана (сегодняшних)' },
              { qty: '100',   unit: 'г',   name: 'бри молодого' },
              { qty: '2',     unit: 'шт',  name: 'сливы спелой' },
              { qty: '1',     unit: 'ст.л', name: 'фисташковой пасты' },
              { qty: '½',     unit: 'ч.л', name: 'мёда (по желанию)' },
              { qty: '',      unit: '',    name: 'щепотка крупной соли' },
            ].map((ing, i) => (
              <div key={i} style={{
                display: 'grid', gridTemplateColumns: '52px 38px 1fr', gap: 8, alignItems: 'baseline',
                padding: '12px 0', borderTop: i === 0 ? 'none' : `1px solid ${T.rule}`,
              }}>
                <span style={{ fontFamily: T.display, fontSize: 22, color: T.ochreDk, lineHeight: 1, fontWeight: 400 }}>{ing.qty}</span>
                <span style={{ fontFamily: T.body, fontSize: 10, letterSpacing: 1.4, color: T.soft, fontWeight: 600, textTransform: 'uppercase' }}>{ing.unit}</span>
                <span style={{ fontSize: 14, color: T.ink, lineHeight: 1.4 }}>{ing.name}</span>
              </div>
            ))}
            <div style={{
              marginTop: 20, paddingTop: 18, borderTop: `2px solid ${T.burg}`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <Eyebrow color={T.burg}>В список покупок</Eyebrow>
              <span style={{ fontFamily: T.body, fontSize: 14, color: T.burg, cursor: 'pointer', fontWeight: 600 }}>+ Добавить ↗</span>
            </div>
          </aside>

          {/* Steps */}
          <div>
            <Eyebrow color={T.ochreDk}>Приготовление</Eyebrow>
            <h3 style={{ fontFamily: T.display, fontStyle: 'italic', fontSize: 42, color: T.burg, margin: '10px 0 32px', letterSpacing: -1, fontWeight: 400 }}>
              Четыре шага.
            </h3>
            {[
              { n: 'I',   t: 'Разогреть круассан',      d: 'Разогрейте духовку до 160°C или используйте сэндвич-мейкер. Круассаны должны быть тёплыми, но не сухими — 4–5 минут хватит.' },
              { n: 'II',  t: 'Подготовить начинку',      d: 'Сливу — на тонкие дольки. Бри — на пластинки 5 мм. Фисташковую пасту достаньте заранее, чтобы её было легко намазать.' },
              { n: 'III', t: 'Собрать',                 d: 'Аккуратно разрежьте круассан вдоль (не до конца!). Намажьте фисташковую пасту, выложите бри, сверху — сливу. Капля мёда, если хочется сладости.' },
              { n: 'IV',  t: 'Подать',                  d: 'Посыпьте крупной солью и подавайте сразу — бри должен немного течь. Хорошо идёт с чёрным кофе или с холодным просекко, если суббота.' },
            ].map((s, i) => (
              <div key={s.n} style={{
                display: 'grid', gridTemplateColumns: '88px 1fr', gap: 24, alignItems: 'start',
                padding: '24px 0', borderTop: `1px solid ${T.rule}`,
              }}>
                <div style={{ fontFamily: T.display, fontStyle: 'italic', fontSize: 60, lineHeight: 0.9, color: T.ochre, fontWeight: 400, paddingTop: 4 }}>
                  {s.n}
                </div>
                <div>
                  <h4 style={{ fontFamily: T.display, fontSize: 26, color: T.burg, margin: 0, letterSpacing: -0.6, fontWeight: 400 }}>{s.t}</h4>
                  <p style={{ marginTop: 8, fontSize: 15, lineHeight: 1.7, color: T.ink, maxWidth: 580, fontFamily: 'Newsreader, Georgia, serif' }}>
                    {s.d}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── КБЖУ Magazine-style ─────────────────────────────────────────── */}
      <section style={{ padding: '0 56px 80px', maxWidth: 1320, margin: '0 auto' }}>
        <div style={{
          background: T.burg, color: T.paper, padding: '56px 56px',
          display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 56, alignItems: 'center',
        }}>
          <div>
            <Eyebrow color={T.ochre}>Пищевая ценность</Eyebrow>
            <h3 style={{ fontFamily: T.display, fontStyle: 'italic', fontWeight: 400, fontSize: 64, lineHeight: 0.9, color: T.paper, margin: '12px 0 18px', letterSpacing: -1.5 }}>
              На&nbsp;порцию.
            </h3>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(242,237,227,.78)', maxWidth: 360, margin: 0 }}>
              Считаем по USDA FoodData Central — государственная база на ~400 000 продуктов. Точность ±5%, не «примерно как ChatGPT сказал».
            </p>
            <div style={{ marginTop: 24, fontFamily: T.body, fontSize: 10, letterSpacing: 1.8, color: 'rgba(242,237,227,.55)', fontWeight: 600, textTransform: 'uppercase', maxWidth: 360, lineHeight: 1.7 }}>
              ※ Значения ориентировочные. Не заменяет&nbsp;консультацию диетолога.
            </div>
          </div>

          <div>
            {/* Big kcal */}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16, paddingBottom: 20, borderBottom: `1px solid rgba(242,237,227,.2)` }}>
              <span style={{ fontFamily: T.display, fontSize: 120, lineHeight: 0.9, color: T.ochre, fontStyle: 'italic', letterSpacing: -4, fontWeight: 400 }}>425</span>
              <span style={{ fontFamily: T.body, fontSize: 12, letterSpacing: 2, color: 'rgba(242,237,227,.8)', fontWeight: 600, textTransform: 'uppercase' }}>ккал · 24% дневной нормы</span>
            </div>

            {/* Macros */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 26, marginTop: 26 }}>
              {[
                ['Белки',    '18', 'г', '36%'],
                ['Жиры',     '24', 'г', '52%'],
                ['Углеводы', '34', 'г', '32%'],
              ].map(([l, v, u, pct]) => (
                <div key={l}>
                  <Eyebrow color="rgba(242,237,227,.65)">{l}</Eyebrow>
                  <div style={{ marginTop: 8 }}>
                    <span style={{ fontFamily: T.display, fontSize: 48, lineHeight: 1, color: T.paper, fontWeight: 400 }}>{v}</span>
                    <span style={{ fontFamily: T.body, fontSize: 11, color: 'rgba(242,237,227,.65)', marginLeft: 6, letterSpacing: 1.4, fontWeight: 600 }}>{u}</span>
                  </div>
                  <div style={{ marginTop: 8, height: 4, background: 'rgba(242,237,227,.15)' }}>
                    <div style={{ height: '100%', width: pct, background: T.ochre }} />
                  </div>
                  <div style={{ marginTop: 6, fontFamily: T.body, fontSize: 10, letterSpacing: 1.6, color: 'rgba(242,237,227,.6)', fontWeight: 600 }}>{pct} от цели</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Personal note ───────────────────────────────────────────────── */}
      <section style={{ padding: '0 56px 80px', maxWidth: 1320, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 56, alignItems: 'start' }}>
          <div style={{ background: T.crust, padding: '40px 36px', borderLeft: `4px solid ${T.ochre}` }}>
            <Eyebrow color={T.burg}>Заметка автора</Eyebrow>
            <p style={{
              marginTop: 14, fontFamily: T.display, fontStyle: 'italic', fontSize: 24,
              lineHeight: 1.45, color: T.burg, fontWeight: 400,
            }}>
              Если бри не нашёлся — берите камамбер или мягкий козий сыр. Если нет фисташковой пасты — попробуйте миндальную или просто измельчите фисташки руками. Не делайте это с готовым джемом — будет слишком сладко и плоско.
            </p>
            <div style={{ marginTop: 14, fontFamily: T.body, fontSize: 11, letterSpacing: 1.6, color: T.soft, fontWeight: 600, textTransform: 'uppercase' }}>
              — Даша, после третьей пробы
            </div>
          </div>
          <div>
            <Eyebrow color={T.ochreDk}>Твоя заметка</Eyebrow>
            <div style={{
              marginTop: 14, background: T.paper, border: `1.5px dashed ${T.rule}`,
              padding: '28px 22px', minHeight: 140, fontFamily: 'Newsreader, Georgia, serif',
              fontStyle: 'italic', fontSize: 16, color: T.muted,
            }}>
              Что вспомнилось, что переделала, кому готовила…
            </div>
            <div style={{ marginTop: 14, fontFamily: T.body, fontSize: 11, letterSpacing: 1.6, color: T.soft, fontWeight: 600, textTransform: 'uppercase' }}>
              Сохраняется в твою книгу · видна только тебе
            </div>
          </div>
        </div>
      </section>

      {/* ── Related ─────────────────────────────────────────────────────── */}
      <section style={{ padding: '40px 56px 64px', maxWidth: 1320, margin: '0 auto', borderTop: `1px solid ${T.rule}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingTop: 40, marginBottom: 28 }}>
          <div>
            <Eyebrow color={T.ochreDk}>Из этой же главы</Eyebrow>
            <h3 style={{ fontFamily: T.display, fontStyle: 'italic', fontSize: 48, color: T.burg, margin: '8px 0 0', letterSpacing: -1, fontWeight: 400 }}>
              Ещё на завтрак.
            </h3>
          </div>
          <span style={{ fontFamily: T.body, fontSize: 12, letterSpacing: 1.8, color: T.burg, fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer' }}>Все из главы &nbsp;→</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28 }}>
          {[
            { n: 'II',  t: 'Каша с шафраном, кардамоном и грушей',  cat: 'Завтрак', kcal: 320, mins: 25, tone: 'cream' },
            { n: 'III', t: 'Тост с авокадо, лаймом и крупной солью', cat: 'Завтрак', kcal: 280, mins: 8,  tone: 'olive' },
            { n: 'IV',  t: 'Скрэмбл с пармезаном и шнитт-луком',     cat: 'Завтрак', kcal: 340, mins: 10, tone: 'warm'  },
          ].map((r) => (
            <article key={r.n} style={{ cursor: 'pointer' }}>
              <div style={{ height: 240, marginBottom: 14, overflow: 'hidden' }}>
                <Placeholder w="100%" h="100%" tone={r.tone} label="ФОТО · top-down" />
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
                <span style={{ fontFamily: T.display, fontStyle: 'italic', fontSize: 44, lineHeight: 0.9, color: T.ochre, fontWeight: 400 }}>{r.n}</span>
                <div style={{ flex: 1 }}>
                  <Eyebrow style={{ marginBottom: 4 }}>{r.cat}</Eyebrow>
                  <div style={{ fontFamily: T.display, fontSize: 22, lineHeight: 1.15, color: T.ink }}>{r.t}</div>
                </div>
              </div>
              <div style={{
                marginTop: 12, paddingTop: 10, borderTop: `1px solid ${T.rule}`,
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

    </div>
  );
};

window.PageRecipe = PageRecipe;

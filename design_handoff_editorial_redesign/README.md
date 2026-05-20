# Handoff: «by Daria» — Editorial Magazine Redesign

> **Для Claude Code.** Прочитай этот файл целиком, затем посмотри HTML-прототип в этой папке (`prototype/by Daria - Прототип.html`). Реализация — в существующем Next.js + Tailwind проекте CookBook. Старая дизайн-система (cream/peach/sage, скруглённые карточки) **полностью заменяется** на новую (burgundy/ochre/paper, magazine-стиль с прямыми углами).

---

## 1. О файлах в этом пакете

Файлы в папке `prototype/` — это **дизайн-референс, созданный в HTML** (React через Babel-standalone, inline-стили). Это **не production-код**. Задача — **воссоздать дизайн в существующем Next.js 14 / Tailwind / TypeScript / Supabase-окружении проекта CookBook**, используя его паттерны:

- Server Components по умолчанию, `'use client'` только где нужен интерактив
- Данные тянуть из Supabase, не хардкодить
- Стили через Tailwind-классы и токены в `tailwind.config.ts`, **не** через inline-style
- Шрифты через `next/font/google`, не через `<link>`
- TypeScript строгий, типы из `src/types/`

## 2. Fidelity

**High-fidelity (hifi).** Цвета, типографика, отступы, иерархия — финальные. Воспроизводить пиксель-в-пиксель. Контент (тексты в прототипе) — образец стиля копирайтинга, не финальные тексты для всех рецептов; финальные тексты приходят из Supabase.

## 3. Что меняется на уровне проекта

### 3.1. `CLAUDE.md` — обновить раздел Design System

Старая дизайн-система (cream/sand/peach/sage, Cormorant + Plus Jakarta, border-radius 20–32px) **больше не актуальна**. Замени раздел "Design System" в `CLAUDE.md` на новый (см. §4 ниже).

### 3.2. `tailwind.config.ts` — новые токены

Заменить блок `theme.extend.colors` целиком:

```ts
colors: {
  paper:    '#F2EDE3',  // основной фон страницы
  crust:    '#E8DFCB',  // фон карточек, асайдов, выделенных блоков
  cream:    '#FAF6EC',  // светлый вкладыш (опц.)
  burg:     '#4A1E1E',  // primary — burgundy, заголовки, primary CTA
  'burg-dk':'#2F1212',
  ochre:    '#C99846',  // accent — italic-вставки в заголовках, плашки, цифры
  'ochre-dk':'#A37A33',
  olive:    '#6B7B4F',  // secondary accent — позитивные индикаторы (●)
  ink:      '#15110D',  // основной текст
  // semantic helpers
  soft:     'rgba(21,17,13,.62)',  // приглушённый текст
  muted:    'rgba(21,17,13,.45)',  // ещё приглушённее (плейсхолдеры)
  rule:     'rgba(21,17,13,.18)',  // горизонтальные/вертикальные правила
},
borderRadius: {
  none: '0',
  sm:   '2px',
  DEFAULT: '0',  // magazine-стиль = прямые углы. Скруглений нет.
},
fontFamily: {
  display: ['var(--font-display)', 'Bodoni Moda', 'Playfair Display', 'serif'],
  body:    ['var(--font-body)',    'Work Sans', 'system-ui', 'sans-serif'],
  reader:  ['var(--font-reader)',  'Newsreader', 'Georgia', 'serif'],
},
letterSpacing: {
  eyebrow: '0.15em',  // ~2.4px при 16px — для caps-labels
  tight:   '-0.02em',
  display: '-0.04em', // -3.4px при 88px — для крупных h1/h2
},
```

### 3.3. `src/app/layout.tsx` — шрифты через next/font

```ts
import { Bodoni_Moda, Work_Sans, Newsreader } from 'next/font/google';

const display = Bodoni_Moda({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  variable: '--font-display',
  display: 'swap',
});
const body = Work_Sans({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});
const reader = Newsreader({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-reader',
  display: 'swap',
});

// в <html>: className={`${display.variable} ${body.variable} ${reader.variable}`}
// в <body>: className="font-body bg-paper text-ink"
```

### 3.4. `src/app/globals.css` — базовые правила

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html, body { background: #F2EDE3; color: #15110D; }
  body { font-family: var(--font-body), system-ui, sans-serif; }
  /* Magazine details */
  details summary::-webkit-details-marker { display: none; }
}

@layer utilities {
  .text-eyebrow {
    font-family: var(--font-body);
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.2em;
    text-transform: uppercase;
  }
}
```

---

## 4. Новая дизайн-система (вставить в `CLAUDE.md`)

### Палитра

| Token | Hex | Использование |
|---|---|---|
| `paper` | `#F2EDE3` | Основной фон страницы |
| `crust` | `#E8DFCB` | Карточки, асайды, "выделенные" блоки |
| `cream` | `#FAF6EC` | Светлый вкладыш (опционально) |
| `burg` | `#4A1E1E` | Primary — заголовки, фон тёмных секций, primary CTA |
| `burg-dk` | `#2F1212` | Hover на burg |
| `ochre` | `#C99846` | Accent — italic-вставки в h1/h2, плашки P. 008, цифры (425), бордеры |
| `ochre-dk` | `#A37A33` | Eyebrow-текст, hover на ochre |
| `olive` | `#6B7B4F` | Позитивные индикаторы (●), feature-чекмарки |
| `ink` | `#15110D` | Основной текст |
| `soft` | `rgba(21,17,13,.62)` | Приглушённый текст, meta |
| `muted` | `rgba(21,17,13,.45)` | Плейсхолдеры |
| `rule` | `rgba(21,17,13,.18)` | Горизонтальные/вертикальные линии-правила |

**Контрастные пары:**
- Светлая секция: `bg-paper` + `text-ink` (заголовки `text-burg`, акценты `text-ochre`)
- Тёмная секция: `bg-burg` + `text-paper` (заголовки тоже `text-paper`, акценты `text-ochre`)

### Шрифты

| Роль | Семейство | Где |
|---|---|---|
| **Display** | Bodoni Moda (italic для акцентов) | h1, h2, h3, цены, цифры, eyebrow-italic-цитаты |
| **Body** | Work Sans | весь UI, кнопки, eyebrow-caps, meta |
| **Reader** | Newsreader (italic) | длинные текстовые блоки (story, notes, FAQ-ответы), drop-cap абзацы |

**Шкала размеров display (Bodoni):**
- Hero h1/h2: 88–120px, `line-height: 0.88–0.92`, `letter-spacing: -3px ÷ -3.4px`
- Section h3: 56–80px, `line-height: 0.95`, `letter-spacing: -2px`
- Card title: 22–26px, `line-height: 1.15`
- Big number (price/kcal): 88–120px italic
- Roman numerals (I, II, III, IV): 44–60px italic, `color: ochre`

**Шкала body:**
- Lede paragraph: 16–17px, `line-height: 1.7–1.85`
- Body: 14–15px, `line-height: 1.7`
- Meta/eyebrow: 10–12px caps, `letter-spacing: 0.15em–0.2em`, `font-weight: 600–700`

### Иконография

**Без иконок.** Magazine-стиль использует **римские цифры** (I–VI), **типографические дроби** (1/3, 37/50), **диакритику** (№, ·, &mdash;), **символы из Unicode** (●, ○, →, ↗, ♡). Никаких SVG-иконок Lucide/Phosphor/etc.

### Углы и тени

**Прямые углы.** `border-radius: 0` везде. Никаких `rounded-2xl`. Единственное исключение — крошечные плашки P. 008 могут иметь `radius: 0` тоже.

**Без drop-shadow.** Глубина создаётся **линиями-правилами** (`1px solid rule`, `2px solid burg`), сменой фона (paper → crust → burg) и **типографикой**, не тенями.

### Сетка и отступы

- Контентный max-width: `1320px`, центрирование `mx-auto`
- Padding по бокам: `56px` на больших экранах (`px-14` в Tailwind = 56px)
- Padding-y секции: `64–96px` (большие воздушные секции)
- Gap между колонками: `36–56px`
- Hero — 2 колонки `1fr 1.1fr`, full-bleed (без боковых паддингов)

### Компоненты-примитивы

Создать в `src/components/ui/`:

1. **`Eyebrow.tsx`** — caps-label, eyebrow-letter-spacing, 11px, weight 600. Используется над каждым заголовком секции. Цвет по умолчанию `text-ochre-dk`, но принимает `color` пропом.
2. **`DropCap.tsx`** — буквица, `float: left`, Bodoni 92px, `line-height: 0.82`, `padding-right: 14px`, `padding-top: 8px`, `color: burg` (или через проп). Применяется к первому символу первого абзаца "story"-блоков.
3. **`Rule.tsx`** — горизонтальная линия. Варианты: `thin` (1px rule), `bold` (2px burg).
4. **`PullQuote.tsx`** — цитата с большими кавычками. Сетка `60px 1fr 60px`. Текст Bodoni italic 44px, кавычки Bodoni 96px ochre. Бордеры сверху и снизу `2px solid burg`. Опциональный `author` под цитатой caps-eyebrow стилем.
5. **`Button.tsx`** — варианты `solid` (burg/paper), `ghost` (transparent + 1.5px burg border), `ochre` (ochre/burg), `paper` (paper/burg). Padding `15px 28px`, font-size 12px, letter-spacing 0.15em, uppercase, weight 600, **`border-radius: 0`**.
6. **`NumberDial.tsx`** — квадрат 88×88, фон ochre, Bodoni-цифра внутри + опциональный caps-label под ней.
7. **`SectionLabel.tsx`** — caps-label поменьше для подсекций.

Все примитивы — без `'use client'` (чисто презентационные).

### Компоненты-сложные

В `src/components/layout/`:

8. **`Header.tsx`** — три ряда: top-strip (Vol/Issue/локаль/login), masthead (Bodoni italic 88px заголовок с brandName), nav (4 секции caps). Цвет по умолчанию paper-фон. Active-state nav — underline 2px burg.
9. **`Footer.tsx`** — burg-фон, 4 колонки: brand-блок (название + описание + CTA) + 3 списка. Низ — copyright caps-eyebrow.

В `src/components/recipe/`:

10. **`RecipeCard.tsx`** — карточка для каталога: фото (height 300px либо 240px для related), плашка `P. 008` ochre top-left, ниже римская цифра italic 56px ochre + eyebrow-категория + Bodoni-заголовок 24px, footer-meta с rule сверху (мин / ккал / Читать →).
11. **`HeroSpread.tsx`** — двухколоночный hero: левая колонка — заголовок-лид-мета, правая — full-bleed фото + ochre-плашка № 01 + градиент-капшен.
12. **`StorySection.tsx`** — `280px 1fr` сетка: левая колонка с eyebrow + Bodoni-заголовок + meta; правая — Newsreader-абзацы с DropCap.
13. **`StatsRow.tsx`** — burg-фон, 2 колонки (заголовок + 4 ячейки 2×2 со статистикой).
14. **`PricingTier.tsx`** — колонка тарифа: глава + цена + лид + список фич с ● / ○ / текстовым значением + CTA. Тёмный (burg-фон) или светлый (paper/crust) вариант.

---

## 5. Карта файлов: что → куда

| Прототип | Целевой файл в `src/` |
|---|---|
| `redesign/v4/theme.jsx` → THEME4 | Tailwind tokens (см. §3.2) |
| `redesign/v4/theme.jsx` → Eyebrow, DropCap, Rule, PullQuote, EditorialButton, NumberDial | `components/ui/*.tsx` |
| `redesign/v4/theme.jsx` → EditorialHeader | `components/layout/Header.tsx` |
| `redesign/v4/theme.jsx` → EditorialFooter | `components/layout/Footer.tsx` |
| `redesign/v4/page-home.jsx` → PageHome | `app/(public)/page.tsx` |
| `redesign/v4/page-recipe.jsx` → PageRecipe | `app/(public)/recipes/[slug]/page.tsx` |
| `redesign/v4/page-pricing.jsx` → PagePricing | `app/(public)/pricing/page.tsx` (новая) |

### Hero-фото
Файл `prototype/assets/hero.png` — это образец визуального стиля (top-down, тёплый свет, деревянная поверхность). В production эти фото приходят из Supabase Storage (`recipe-covers`, `step-photos`). Для разработки можно положить hero.png в `public/` как фолбэк.

---

## 6. Страницы — детальная спецификация

### 6.1. Home (`app/(public)/page.tsx`)

Секции в порядке сверху вниз:

1. **Hero spread** — 2 колонки `1fr 1.1fr`, минимальная высота 760px, разделитель `1px rule` снизу.
   - Левая: eyebrow «Глава I · Завтрак · Воскресный выпуск» → h2 Bodoni 120px (`Готовлю / для тех, кого люблю.`, вторая строка italic ochre) → lede 17px soft, max-width 480px → CTA-пара (solid + ghost) → 3 мета-факта (`±5%`, `USDA`, `2-я`) caps-eyebrow с display-вставками burg italic.
   - Правая: full-bleed `HeroPhoto` + ochre-плашка `№ 01 / На обложке` top-left + капшен `Fig. I — Портрет блюда` с градиентом снизу.

2. **Колонка редактора** — `280px 1fr` сетка, padding `88px 56px 56px`, max-w 1320.
   - Слева: eyebrow + Bodoni 56px h3 (`Зачем / эта книга.`) + meta (Эссе № 1 / дата / время чтения).
   - Справа: 2 абзаца Newsreader 17px italic с DropCap на первом, плюс подпись italic «— Дарья Бобина, редактор. Прага, май 2026.»

3. **Pull quote** — `PullQuote` компонент, author "Из колонки редактора, выпуск № 1".

4. **Содержание выпуска** — eyebrow + Bodoni 72px h3 (`Шесть глав мая.`), справа кнопка-ссылка "Все рецепты →". Грид `repeat(3, 1fr)` с gap 36px и row-gap 56px из 6 `RecipeCard` (данные из Supabase: `recipes` LIMIT 6 published=true).

5. **Кухня в цифрах** — burg-фон, padding `72px 56px`, сетка `1fr 2fr`. Слева eyebrow + Bodoni italic 56px заголовок (`Почему это / не очередной / сборник рецептов.`), справа 2×2 грид: число (`±5%`, `10 / 5`, `€7.90`, `50`) Bodoni 64px ochre + подпись 13px paper-78%. Каждая ячейка разделена `1px rgba(paper, .2)`.

6. **Подписка-тизер** — crust-фон, padding `64px 56px`, сетка `1.3fr 1fr` (vertical-align: end). Слева: eyebrow + Bodoni 80px h3 (`Получи / весь номер.` с italic ochre) + lede + 2 CTA. Справа: вертикальный divider 1px rule, eyebrow + Bodoni italic 100px цена `€79` + lede + caps-индикатор `● 37 / 50 уже заняты`.

### 6.2. Recipe detail (`app/(public)/recipes/[slug]/page.tsx`)

1. **Breadcrumb-strip** — flex space-between, 11px caps: `← Все рецепты` / `Глава I · Завтрак · Recipe № 01 · P. 008` / `♡ в книгу` + `Поделиться ↗`. `1px rule` снизу.

2. **Title + meta** — сетка `1.6fr 1fr`, align-items: end. Слева: eyebrow + Bodoni 96px h2 (3 строки с italic ochre на последней). Справа: `2px burg` top-border, 2×2 грид метрик (`Время / Порций / Сложность / Калории`), каждая = eyebrow caps + Bodoni 36px burg + caps-unit.

3. **Hero photo** — height 580px, full-bleed внутри max-w 1320. Градиент-капшен снизу с eyebrow + Bodoni italic 22px.

4. **Story** — `280px 1fr` сетка, padding `88px 56px 40px`. Слева eyebrow + Bodoni italic 22px цитата + caps-подпись «— Даша». Справа `column-count: 2` Newsreader 17px italic с DropCap.

5. **Ingredients + Steps** — сетка `1fr 1.6fr`, gap 56px.
   - Слева sticky-aside (top: 24px): crust-фон, padding 32×28, eyebrow «Состав» + Bodoni italic 36px «на 2 порции» + список ингредиентов (грид `52px 38px 1fr`: количество Bodoni 22px ochre-dk / единица caps 10px soft / название 14px ink), каждый разделён `1px rule`. Низ — `2px burg` top-border + ссылка `+ Добавить ↗`.
   - Справа: eyebrow + Bodoni italic 42px «Четыре шага.» + список шагов. Каждый шаг — сетка `88px 1fr`, gap 24px, разделён `1px rule` сверху: римская цифра italic 60px ochre + Bodoni 26px заголовок шага + Newsreader 15px описание.

6. **КБЖУ-блок** — burg-фон, padding 56×56, сетка `1fr 1.4fr`. Слева eyebrow ochre + Bodoni italic 64px «На порцию.» + лид + caps-disclaimer. Справа: большой число калорий Bodoni italic 120px ochre + caps `425 ккал · 24% дневной нормы` (с `1px rule` снизу), ниже 3 макроса грид: Белки/Жиры/Углеводы — каждый = eyebrow + Bodoni 48px paper + unit + 4px полоса (rgba(paper,.15) фон, ochre заливка с шириной %) + caps «% от цели».

7. **Personal note** — сетка `1.4fr 1fr`.
   - Слева: crust-фон, `4px solid ochre` left-border, eyebrow + Bodoni italic 24px текст + caps-подпись.
   - Справа: eyebrow + dashed-border-блок paper-фон, padding 28×22, minHeight 140, Newsreader italic 16px muted-плейсхолдер.

8. **Related** — `1px rule` top-border. Грид `repeat(3, 1fr)` из 3 `RecipeCard` (related recipes из той же `category`).

### 6.3. Pricing (`app/(public)/pricing/page.tsx`)

1. **Header** — сетка `1.4fr 1fr`, align-items: end. Слева: eyebrow + Bodoni 120px (`Получи / весь номер.` italic ochre на 2-й строке). Справа: лид 16px + `2px burg` top-border с 3 caps-фактами (`● отмена в один клик / ● без рекламы / ● VAT включён · Paddle`), olive `●`.

2. **3 tiers** — сетка `repeat(3, 1fr)`, gap 0 (соприкасаются), разделены `1px rule` справа у первых двух.
   - **Free** — paper-фон, римская I, цена `€0` Bodoni 88px, лид Newsreader italic, список 12 фич (true → olive `●`, false → muted `○` + line-through, текст → caps ochre-dk), ghost-кнопка, низ-caps «Без карты».
   - **Premium** — **burg-фон, paper-текст**, ochre-плашка «Самый частый выбор» сверху absolute, римская II ochre, цена `€7.90`, лид с caps `/ мес или €69 / год`, фичи (true → olive `●`, false → paper-35% `○`, текст → ochre caps), solid-paper-кнопка `Оформить Premium`, низ-caps `Yearly: ≈ €5.75 / мес`.
   - **Lifetime** — crust-фон, ochre-плашка «Закрывается при наборе 50», римская III, цена `€79` + caps `разово · первые 50`, ochre-кнопка `Стать учредителем · 37 / 50`, низ «13 мест осталось».

3. **AI-картинки кредитами** — crust-фон, `6px solid ochre` left-border, сетка `1fr 2fr`. Слева eyebrow + Bodoni italic 52px «Когда фото / нет — рисуем.» + лид. Справа `repeat(3,1fr)` карточки пакетов S/M/L (paper-фон, 1px rule бордер): размер Bodoni 40px ochre italic + caps «пакет» + цена Bodoni 32px + описание 12px soft.

4. **Pull quote** — `PullQuote` с testimonial автора.

5. **FAQ** — сетка `1fr 2fr`. Слева eyebrow + Bodoni 72px h3 (`Прежде / чем платить — / прочитай.` italic ochre на 3-й). Справа `<details>` items, summary = Bodoni italic 22px + caps-ochre `+ Открыть`, разделены `1px rule` сверху. Открытое состояние показывает Newsreader 14px ответ.

6. **Final CTA** — burg-фон, сетка `2fr 1fr`. Слева eyebrow ochre + Bodoni 80px «Открыть «{brandName}».» + лид. Справа: 2 широкие кнопки (ochre + paper) + ghost-ссылка «Сначала бесплатно →».

---

## 7. Интеракции и поведение

- **Page transitions:** добавь GSAP fade-up (y: 8, opacity: 0 → y: 0, opacity: 1, 0.35s, `cubic-bezier(.2,.8,.3,1)`) при смене роута. Уже в `package.json` есть `gsap`.
- **Card hover:** `RecipeCard` поднимается на `y: -2px`, плашка `P. 008` чуть темнее (`ochre-dk`). Без scale, без тени.
- **Button hover:** solid → bg `burg-dk`. Ghost → bg `burg` + text `paper`. Ochre → bg `ochre-dk`.
- **Stagger scroll-reveal:** на грид `RecipeCard` в каталоге и related — GSAP ScrollTrigger, `y: 30 → 0`, `stagger: 0.08`, `duration: 0.6`, `ease: 'power2.out'`.
- **`<details>` (FAQ):** при открытии заменить caps-текст `+ Открыть` → `– Закрыть`. Анимация раскрытия через CSS `interpolate-size` или JS (если CSS не поддерживается).
- **Sticky aside (ingredients):** `position: sticky; top: 24px`. Только на десктопе ≥1024px.

## 8. Состояния и данные

Все страницы — **Server Components** (`page.tsx` без `'use client'`). Тянуть данные из Supabase:

```ts
// app/(public)/page.tsx
const supabase = createServerClient();
const { data: featuredRecipes } = await supabase
  .from('recipes')
  .select('id, slug, title, description, cover_image, recipe_categories(category:categories(name, slug))')
  .eq('published', true)
  .order('created_at', { ascending: false })
  .limit(6);
```

Где в прототипе хардкод текста (например, "Слово редактора" эссе) — это **placeholder copy**. В production либо вшит в код страницы (как часть лендинга), либо лежит в отдельной таблице `editorial_essays` (если её нет — создать в этой же миграции).

Поля, которых **может не быть** в текущей схеме и которые нужны:
- `recipes.chapter` (text, nullable) — для римской цифры (`I`, `II`, …). Можно вычислять из `recipe_categories`.
- `recipes.page_number` (text, nullable) — для плашки `P. 008`.
- `recipes.time_minutes` (int) — для меты «15 мин».
- `recipes.servings` (int) — порций.
- `recipes.difficulty` (int 1–3) — `I / III`.
- `recipes.nutrition` (jsonb) — `{ kcal, protein, fat, carbs }`. Маппится в USDA через AI-нутрициолог (см. `AI_ARCHITECTURE.md`).

Если каких-то полей нет — добавь миграцию.

## 9. Адаптивность

Прототип спроектирован для десктопа 1280–1440px. **Мобильная адаптация — твоя задача**:

- < 768px: все двух- и трёхколоночные сетки → 1 колонка. Hero → стек (фото сверху, текст снизу). Pricing — 1 колонка тарифов друг за другом. Шрифты h1/h2 — 56–72px вместо 96–120px.
- 768–1023px: 2 колонки там, где было 3 (Содержание, Related, AI-пакеты).
- ≥ 1024px: как в прототипе.
- Padding по бокам: `24px` mobile, `40px` tablet, `56px` desktop.

## 10. Доступность

- `<button>` для всего кликабельного, не `<div onClick>`.
- Контрастность: paper/ink = 14:1 ✓, paper/burg = 11:1 ✓, paper/soft = 5.4:1 ✓, paper/muted = 3.9:1 ⚠ (только для декоративного). Ochre на paper = 2.9:1 ✗ — **только для крупного display-текста (≥24px) или декоративных элементов**, не для основного текста.
- Все cap-labels — реальные caps в HTML с `text-transform: uppercase`, не в Unicode capital letters.
- `lang="ru"` на html, для не-русских блоков `lang="cs"` / `lang="en"`.
- `<details>` нативный — keyboard-доступен из коробки.

## 11. Дизайн-токены — полный список

```
COLORS
paper       #F2EDE3   background
crust       #E8DFCB   card / aside / accent surfaces
cream       #FAF6EC   optional light insert
burg        #4A1E1E   primary
burg-dk     #2F1212   primary hover
ochre       #C99846   accent
ochre-dk    #A37A33   accent hover / eyebrow
olive       #6B7B4F   positive indicator
ink         #15110D   text
soft        rgba(21,17,13,.62)   muted text
muted       rgba(21,17,13,.45)   placeholder
rule        rgba(21,17,13,.18)   dividers

SPACING (Tailwind scale already covers this)
section-y           64px / 72px / 88px / 96px
section-x           56px
content-max-width   1320px
column-gap          36px / 56px
card-gap            18px / 24px

TYPE
display Bodoni Moda  88-120 / 56-80 / 22-26 / 38-44 italic
body    Work Sans    13-17 / 11-12 (caps eyebrow)
reader  Newsreader   15-17 italic, line-height 1.7-1.85

RADIUS
all          0px (magazine)

SHADOWS
none — use rules + background changes

BORDERS
hairline    1px solid rule
heavy       2px solid burg
accent-left 4px / 6px solid ochre  (used on quote-cards and CTA-cards)
```

---

## 12. Чек-лист имплементации (для Claude Code)

Рекомендованный порядок работы:

1. ☐ Обновить `tailwind.config.ts` (палитра, шрифты, letterSpacing, borderRadius)
2. ☐ Обновить `src/app/layout.tsx` (next/font/google + html-классы + bg/text по умолчанию)
3. ☐ Обновить `src/app/globals.css` (base layer)
4. ☐ Переписать раздел "Design System" в `CLAUDE.md` под новый magazine-стиль (взять §4 этого файла)
5. ☐ Создать UI-примитивы: `Eyebrow`, `DropCap`, `Rule`, `PullQuote`, `Button`, `NumberDial`, `SectionLabel` в `src/components/ui/`
6. ☐ Переписать `Header.tsx` и `Footer.tsx` в `src/components/layout/`
7. ☐ Создать `RecipeCard`, `HeroSpread`, `StorySection`, `StatsRow`, `PricingTier` в `src/components/recipe/` (и `/marketing/` если такой папки нет)
8. ☐ Переписать `app/(public)/page.tsx` (home)
9. ☐ Переписать `app/(public)/recipes/[slug]/page.tsx` (recipe detail)
10. ☐ Создать `app/(public)/pricing/page.tsx`
11. ☐ Проверить миграции БД (поля `chapter`, `page_number`, `time_minutes`, `servings`, `difficulty`, `nutrition`); добавить недостающие
12. ☐ Адаптивность (см. §9)
13. ☐ GSAP-анимации (см. §7)
14. ☐ Существующий admin-портал (`src/app/admin/`) и dashboard — оставить функционально как есть, **но прогнать через новые токены** (paper-фон, burg-кнопки, прямые углы, Bodoni-заголовки). Это уже не magazine — это просто админка с теми же токенами.
15. ☐ Удалить старые `cream`, `sand`, `peach`, `sage` токены из `tailwind.config.ts` и из всех `className` (поиск + замена)

---

## 13. Что НЕ менять

- Структуру роутинга, `(public)` / `(auth)` / `dashboard` / `admin` группы — остаются.
- Auth flow через Supabase — остаётся.
- `AI_ARCHITECTURE.md`, `PRODUCT_STRATEGY.md` — не трогать.
- i18n через `next-intl` — остаётся, ключи переводов из прототипа можно положить в `messages/ru.json`.
- Supabase schema — расширяется (см. §8), не заменяется.

---

## 14. Файлы в этом пакете

```
design_handoff_editorial_redesign/
├── README.md                              ← этот файл
├── prototype/
│   ├── by Daria - Прототип.html           главный HTML
│   ├── redesign/
│   │   ├── shared.jsx                     Placeholder, HeroPhoto
│   │   └── v4/
│   │       ├── theme.jsx                  THEME4 tokens + primitives + Header/Footer
│   │       ├── page-home.jsx              PageHome
│   │       ├── page-recipe.jsx            PageRecipe
│   │       └── page-pricing.jsx           PagePricing
│   ├── assets/
│   │   └── hero.png                       образец top-down photography
│   ├── tweaks-panel.jsx                   панель тюнинга (не нужна в production)
│   └── design-canvas.jsx                  canvas для исследования (не нужна в production)
└── screenshots/
    ├── 01-home.png
    ├── 02-recipe.png
    └── 03-pricing.png
```

Если нужны уточнения по конкретной секции — открой `prototype/by Daria - Прототип.html` в браузере, дизайн интерактивный, можно переключать страницы через панель Tweaks справа внизу.

—

**Удачи. Если застрянешь на конкретном компоненте — открой соответствующий `.jsx` в `prototype/redesign/v4/` и копируй inline-стили один-в-один, потом конвертируй в Tailwind-классы.**

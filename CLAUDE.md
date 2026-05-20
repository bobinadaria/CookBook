# Cookbook — Project Brief for Claude Code

## Project Overview
Personal recipe book web application — a curated collection of the owner's recipes, beautifully presented. The site reflects a personal identity: beauty, taste, coziness, wellness, pleasure, uniqueness, and daily celebration. Not a generic recipe site — it should feel like a personal art object.

## Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Animations:** GSAP (ScrollTrigger, stagger, smooth scroll — reference: antimetal.com feel)
- **Language:** TypeScript (strict mode)
- **Backend / DB:** Supabase (PostgreSQL + Auth + Storage)
- **Deployment:** Vercel
- **Package manager:** npm

## User Roles
| Role | Access |
|------|--------|
| **Guest** (unauthenticated) | Browse all recipes, search, filter |
| **User** (authenticated) | Save favorites, personal notes (MVP); own recipe book (future) |
| **Admin** (owner only) | Full CRUD on recipes, categories, labels via /admin portal |

Admin is identified by a special `role` field in Supabase. Use Supabase RLS (Row Level Security) to enforce permissions at the database level.

## Database Schema (Supabase / PostgreSQL)

```sql
-- Profiles (extends Supabase auth.users)
profiles (
  id          uuid references auth.users primary key,
  email       text,
  role        text default 'user', -- 'user' | 'admin'
  created_at  timestamptz default now()
)

-- Categories / Labels
categories (
  id    uuid primary key default gen_random_uuid(),
  name  text not null,
  slug  text unique not null,
  type  text not null -- 'country' | 'category'
)

-- Recipes
recipes (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  slug         text unique not null,
  description  text,
  note         text,           -- personal story / history of the dish
  cover_image  text,           -- URL from Supabase Storage
  published    boolean default false,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
)

-- Recipe ↔ Category (many-to-many)
recipe_categories (
  recipe_id   uuid references recipes(id) on delete cascade,
  category_id uuid references categories(id) on delete cascade,
  primary key (recipe_id, category_id)
)

-- Recipe Steps (ordered, each with photo)
steps (
  id          uuid primary key default gen_random_uuid(),
  recipe_id   uuid references recipes(id) on delete cascade,
  order       integer not null,
  title       text,
  description text not null,
  photo_url   text  -- URL from Supabase Storage
)

-- User Favorites
favorites (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id) on delete cascade,
  recipe_id  uuid references recipes(id) on delete cascade,
  created_at timestamptz default now(),
  unique(user_id, recipe_id)
)

-- User Notes on Recipes
user_notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references profiles(id) on delete cascade,
  recipe_id  uuid references recipes(id) on delete cascade,
  content    text,
  updated_at timestamptz default now(),
  unique(user_id, recipe_id)
)
```

## Supabase Storage Buckets
- `recipe-covers` — cover images for recipes (public)
- `step-photos` — photos for each cooking step (public)

## Project Structure (Next.js App Router)

```
src/
├── app/
│   ├── (public)/
│   │   ├── page.tsx                  # Home — hero + featured recipes
│   │   ├── recipes/
│   │   │   ├── page.tsx              # Recipe catalog (search, filter)
│   │   │   └── [slug]/
│   │   │       └── page.tsx          # Recipe detail page
│   │   └── layout.tsx
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   ├── dashboard/
│   │   ├── page.tsx                  # User personal cabinet
│   │   ├── favorites/page.tsx        # Saved recipes
│   │   └── notes/page.tsx            # Personal notes
│   ├── admin/
│   │   ├── page.tsx                  # Admin dashboard
│   │   ├── recipes/
│   │   │   ├── page.tsx              # Recipe list
│   │   │   ├── new/page.tsx          # Create recipe
│   │   │   └── [id]/edit/page.tsx    # Edit recipe
│   │   └── categories/page.tsx
│   ├── layout.tsx                    # Root layout
│   └── globals.css
├── components/
│   ├── ui/                           # Base components (Button, Input, Card...)
│   ├── recipe/                       # RecipeCard, RecipeGrid, StepCard...
│   ├── layout/                       # Header, Footer, Nav
│   └── animations/                   # GSAP wrappers and hooks
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Browser client
│   │   ├── server.ts                 # Server client (RSC)
│   │   └── middleware.ts
│   └── utils.ts
├── hooks/                            # Custom React hooks
├── types/                            # TypeScript interfaces
└── middleware.ts                     # Auth route protection
```

## Design System

> **Editorial magazine redesign (2026).** Старая система (cream/sand/peach/sage,
> Cormorant + Plus Jakarta, скруглённые карточки, тени) заменяется на magazine-стиль:
> burgundy/ochre/paper, Bodoni Moda + Work Sans + Newsreader, **прямые углы, без теней**,
> глубина строится линиями-правилами и сменой фона. Полный хендофф:
> `design_handoff_editorial_redesign/README.md`. Миграция идёт по чек-листу §12 этого
> хендоффа; legacy-токены удаляются последним шагом (#15).

### Палитра (Tailwind tokens)
```js
colors: {
  paper:    '#F2EDE3',  // основной фон страницы
  crust:    '#E8DFCB',  // карточки, асайды, выделенные блоки
  burg:     '#4A1E1E',  // primary — заголовки, тёмные секции, primary CTA
  'burg-dk':'#2F1212',  // hover на burg
  ochre:    '#C99846',  // accent — italic-вставки в h1/h2, плашки, цифры, бордеры
  'ochre-dk':'#A37A33', // eyebrow, hover на ochre
  olive:    '#6B7B4F',  // позитивные индикаторы (●), feature-чекмарки
  ink:      '#15110D',  // основной текст
  soft:     'rgba(21,17,13,.62)',  // приглушённый текст, meta
  muted:    'rgba(21,17,13,.45)',  // плейсхолдеры
  rule:     'rgba(21,17,13,.18)',  // линии-правила
}
```
**Контрастные пары:** светлая секция `bg-paper` + `text-ink` (заголовки `text-burg`,
акценты `text-ochre`); тёмная секция `bg-burg` + `text-paper` (акценты `text-ochre`).

### Типографика (через `next/font/google`)
| Роль | Семейство | Tailwind | Где |
|---|---|---|---|
| Display | Bodoni Moda (+ italic) | `font-display` | h1/h2/h3, цены, цифры, римские цифры |
| Body | Work Sans | `font-body` | весь UI, кнопки, eyebrow-caps, meta |
| Reader | Newsreader (+ italic) | `font-reader` | длинные тексты (story, notes, FAQ), drop-cap абзацы |

Шкала: hero h1/h2 88–120px (`tracking-display`, `leading` 0.88–0.92); section h3 56–80px;
card title 22–26px; lede 16–17px (`leading` 1.7–1.85); eyebrow 10–12px caps (`tracking-eyebrow`, weight 600–700).

### Углы, тени, иконки
- **Прямые углы** — `border-radius: 0` (Tailwind `rounded` = 0). Никаких `rounded-2xl`.
- **Без теней** — глубина через линии-правила (`1px solid rule`, `2px solid burg`) и смену фона.
- **Без SVG-иконок** — magazine использует римские цифры (I–VI), типографические дроби,
  диакритику (№ · —), Unicode-символы (● ○ → ↗ ♡).

### Сетка и отступы
- Контентный max-width `1320px`, центрирование `mx-auto`.
- Боковой padding: 24px (mobile) / 40px (tablet) / 56px (`px-14`, desktop).
- Padding-y секций 64–96px; gap колонок 36–56px.
- Hero — 2 колонки `1fr 1.1fr`, full-bleed.

### UI-примитивы (`src/components/ui/`)
`Eyebrow`, `DropCap`, `Rule`, `PullQuote`, `Button` (варианты solid/ghost/ochre/paper),
`NumberDial`, `SectionLabel` — чисто презентационные, без `'use client'`.

### Анимации (GSAP)
- Page transitions: fade-up `y: 8 → 0, opacity 0 → 1`, 0.35s, `cubic-bezier(.2,.8,.3,1)`.
- Card hover: `y: -2px`, плашка `P. 008` темнеет до `ochre-dk`. Без scale, без тени.
- Scroll-reveal грид карточек: ScrollTrigger, `y: 30 → 0`, `stagger: 0.08`, `0.6s`, `power2.out`.

## Key Features (MVP)

### Phase 1 — Foundation
- [ ] Next.js 14 project init with TypeScript + Tailwind
- [ ] Supabase project setup: schema, RLS policies, storage buckets
- [ ] Auth: email/password login + registration
- [ ] Middleware: route protection for /dashboard and /admin

### Phase 2 — Public Front-end
- [ ] Home page: hero section + featured recipes grid
- [ ] Recipe catalog: asymmetric grid, search by name, filter by category/country
- [ ] Recipe detail page: cover, description, steps with photos, note/story block, labels
- [ ] GSAP animations across all pages

### Phase 3 — Admin Panel
- [ ] /admin: dashboard overview
- [ ] Recipe CRUD: create / edit / delete
- [ ] Step management: add/reorder/remove steps with photo upload to Supabase Storage
- [ ] Category management

### Phase 4 — User Dashboard
- [ ] Save / unsave recipes to favorites
- [ ] Personal notes per recipe
- [ ] User profile page

### Phase 5 — Polish & Deploy
- [ ] i18n: Russian + English (use `next-intl`)
- [ ] Responsive design (mobile-first)
- [ ] SEO: metadata, OpenGraph, sitemap
- [ ] Deploy to Vercel, connect Supabase env vars

## Future Features (Post-MVP)
- AI recipe generation via Claude API (e.g., "generate a recipe with 30g protein")
- Users can create and manage their own personal recipe collections
- Mobile app (React Native or PWA)

## Internationalization
- **Languages:** Russian (default) + English
- **Library:** `next-intl`
- **Locale files:** `/messages/ru.json` and `/messages/en.json`

## Photography Strategy (MVP)
All recipe images generated via **Midjourney** or **Leonardo.AI** using a consistent style prompt:
```
top-down view, warm natural light, wooden surface, soft shadows,
appetizing, cozy home kitchen aesthetic, film photography feel,
muted warm tones --ar 4:3
```
This ensures visual consistency across all recipes on the site.

## Code Conventions
- Use **Server Components** by default; `'use client'` only when needed (interactivity, hooks, GSAP)
- Prefer **async/await** with Supabase server client in RSC
- All Supabase queries through typed helper functions in `lib/supabase/`
- No `any` types — use proper TypeScript interfaces in `types/`
- Use **Zod** for form validation
- Component naming: PascalCase; file naming: kebab-case
- Keep components small and focused; extract logic to custom hooks

## Important Constraints
- Budget-conscious: use free tiers where possible (Supabase free, Vercel hobby)
- No over-engineering: build only what's needed for the current phase
- Mobile-first responsive design from day one
- Accessibility: semantic HTML, proper alt text, keyboard navigation

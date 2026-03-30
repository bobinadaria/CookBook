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

### Color Palette (Tailwind custom tokens)
```js
// tailwind.config.ts
colors: {
  cream:     '#FDFAF5',  // main background
  sand:      '#F2E8DC',  // card backgrounds, hover states
  charcoal:  '#1C1917',  // primary text
  peach:     '#E8956D',  // primary accent (appetite, warmth)
  'peach-dark': '#D4956A', // hover on peach
  sage:      '#8BAF8C',  // secondary accent (health, nature)
  'sage-dark':  '#6B9470',
}
```

### Typography
```css
/* Headings H1-H2 */  font-family: 'Cormorant Garamond', serif;
/* Headings H3-H4 */  font-family: 'DM Serif Display', serif;
/* Handwritten accent (short labels only) */ font-family: 'Satisfy', cursive;
/* Body / UI */        font-family: 'Plus Jakarta Sans', sans-serif;
```
Load via `next/font/google`.

### Layout Principles
- Asymmetric, playful grid (cards of different sizes — reference: ottolenghi.co.uk/pages/recipes)
- `border-radius: 20-32px` on cards and images (soft, organic)
- Soft warm shadows: `box-shadow: 0 8px 32px rgba(28,25,23,0.08)`
- Generous whitespace — let content breathe
- GSAP animations: stagger card entrance on scroll, subtle card lift on hover, smooth page transitions
- Recipe detail: medium-sized hero image (not full-screen), then title + description side-by-side, then steps with photos inline
- "Story / Note" block: visually distinct — Satisfy font, sand background, like a handwritten card

### Animation Guidelines (GSAP)
- Use ScrollTrigger for all scroll-based reveals
- Stagger: `stagger: 0.08` for recipe card grids
- Entrance: `y: 30, opacity: 0` → `y: 0, opacity: 1`, duration `0.6`, ease `power2.out`
- Hover card lift: `y: -4`, scale `1.01`, subtle shadow increase
- Page transitions: smooth fade between routes
- Performance: use `will-change: transform` and `gsap.ticker.lagSmoothing(0)` for buttery scroll

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

## Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXTAUTH_SECRET=                    # if needed
```

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

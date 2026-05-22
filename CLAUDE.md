# The Slow Table — операционный бриф для Claude

> **Бренд.** Название продукта — **The Slow Table** · by Daria (домен `bydaria.kitchen`).
> Слоган: «Твоя кухня. Твоя книга. Твой AI-нутрициолог.» Дескриптор: «Создавай свою книгу
> красивых рецептов — уют дома, идеи на каждый день и точное КБЖУ от AI.» Рабочее имя
> репозитория осталось «Cookbook». Полные детали бренда — `BRAND_PLAN.md`.
>
> **Что это.** Личная кулинарная книга-журнал русскоязычного автора (Дарья, Прага) с
> AI-нутрициологом. Эстетика editorial-magazine, точный КБЖУ через USDA, двуязычие RU/EN.
> Не «очередной сборник рецептов» — личный продукт-объект.
>
> **Этот файл** — главный контекст для ИИ-ассистента: актуальное состояние, следующие шаги,
> правила работы. Держи его в синхроне с кодом. Длинные тексты — в `PRODUCT_STRATEGY.md`
> (бизнес) и `AI_ARCHITECTURE.md` (AI-слой).
>
> **Обновлено:** 2026-05-22.

---

## 1. Текущее состояние (single source of truth по статусу)

**Стадия:** работающее MVP в проде на Vercel. Не pre-MVP. Монетизация ещё не подключена.

**Готово и работает:**

- **Auth** — Supabase Auth: email+пароль, Google OAuth, forgot/reset password. Middleware
  защищает `/dashboard` и `/admin`.
- **Публичный сайт** (editorial-редизайн полностью внедрён):
  - Главная — hero-разворот, колонка редактора, pull-quote, «Содержание выпуска» (featured),
    «Кухня в цифрах», тизер подписки.
  - Каталог `/recipes` — поиск + фильтры (4 типа категорий), magazine-карточки.
  - Рецепт `/recipes/[slug]` — заголовок+метрики, состав, шаги, КБЖУ-блок, заметка автора +
    личная заметка, related; ISR-кэш + JSON-LD.
  - Подписка `/pricing` — 3 тарифа, AI-кредиты, FAQ, CTA (лендинг, без реальной оплаты).
- **Личный кабинет** `/dashboard` — хаб, избранное, заметки (`user_notes`), профиль с display_name,
  PlanBanner (каркас под монетизацию, без реальных счётчиков).
- **Админка** `/admin` — CRUD рецептов, шаги с фото, категории, AI-секции (см. ниже). RU-only.
- **AI-слой** (рантайм — OpenAI, не Claude):
  - КБЖУ: парсинг ингредиентов `gpt-4o-mini` → матчинг в `ingredients_base` (USDA + рус-справочники,
    pg_trgm fuzzy) → детерминированный расчёт. Авто-расчёт при сохранении + кеш по hash состава.
  - Обложки: генерация через `gpt-image-1` / `dall-e-3` (см. `scripts/gen-cover.mjs`), сжатие `sharp`.
  - Автоперевод RU→EN полей рецепта (`gpt-4o-mini`).
- **i18n** — next-intl, RU (default) + EN, переключение по cookie без URL-префикса. Весь лендинг
  и UI вынесены в `messages/`. Контент рецептов — двуязычный в БД (`*_en` поля).
- **Тёмная тема** — токены для dark есть, контраст текста-на-охре починен (токен `seal`).
  ✅ Решено (2026-05-21): «тёмные» секции-баннеры (блок КБЖУ, тёмные CTA, футер, premium-тариф)
  больше НЕ инвертируются в кремовый. Заведено отдельное стабильное семейство токенов `section`
  (`bg-section` / `text-section-fg` / `text-section-soft` / `border-section-rule`; объявлено в
  `globals.css :root`, без override в `.dark`) — эти блоки остаются тёмными в обеих темах.
  Заголовки, кнопки и бейджи по-прежнему инвертируются (светлая «пилюля» на тёмном) — это норма.
- **Перф** — ISR-кэш страниц рецептов, статическая прегенерация, сжатие обложек.

**НЕ сделано (намеренно отложено или в бэклоге):**

- Реальные платежи (Paddle), enforcement кредитов, гейтинг Premium-фич — **не раньше ~месяца 10**
  по стратегии. Сейчас `/pricing` и PlanBanner — только каркас.
- Premium-фичи: импорт рецепта по URL, экспорт в PDF, меню недели + список покупок.
- AI-генерация рецептов для пользователя («сделай рецепт с 30 г белка»).
- B2B-тариф (планируется месяцы 10–12).

---

## 2. Следующие шаги (приоритезированный бэклог)

✅ **Закрыто (релиз 2026-05-21…22):**
1. ~~Деплой ветки (редизайн + EN) на Vercel~~ — выложено в прод, прод проверен (live).
2. ~~Тёмная тема~~ — тёмные секции остаются тёмными (токены `section`), проверено на телефоне.
3. ~~Вычитка EN-копирайта~~ — имя в футере локализовано (`footer.author`: Daria Bobina),
   `base→database` в FAQ, `Yearly:→В год:` в RU. Опциональные хвосты (на вкус автора):
   единый US/UK-спеллинг (`flavour`↔`flavor`), «№»→«No.» в EN, «lifts the ceilings».

**Активный бэклог (следующее):**
4. **Подготовка к монетизации** (по стратегии — не раньше ~месяца 10): Paddle, таблица/логика
   кредитов, гейтинг фич, рабочий PlanBanner.
5. **Premium-фичи** по одной (импорт URL → PDF-экспорт → меню недели).
6. **Контент** — наполнить книгу рецептами (лендинг заявляет «42 рецепта», в каталоге пока мало).

> Правило: при закрытии шага — обнови §1 и §2, чтобы здесь не было устаревших данных.

---

## 3. Стек и команды

- **Framework:** Next.js 14 (App Router) · **TypeScript** (strict) · **Tailwind CSS**
- **Backend:** Supabase (Postgres + Auth + Storage) · RLS на уровне БД
- **AI:** OpenAI (`openai`), вспомогательно `@google/generative-ai`
- **Анимации:** GSAP (ScrollTrigger) · **Темы:** next-themes · **i18n:** next-intl
- **Изображения:** `sharp` (сжатие) · **Валидация:** Zod · **Деплой:** Vercel · **Пакетный менеджер:** npm

```bash
npm run dev      # http://localhost:3000 (dev, hot-reload)
npm run build    # прод-сборка (тянет Supabase на этапе static generation)
npm run start    # запуск прод-сборки локально
npm run lint     # ESLint
npx tsc --noEmit # проверка типов
```

> ⚠️ Не запускай `dev` и `build`/`start` одновременно — они пишут в общий `.next` и портят его.
> При странных ошибках сборки: `rm -rf .next && npm run build`.

**One-off скрипты** (`scripts/`, запуск через `node`, тянут `.env.local`):
`seed-ingredients.mjs` (наполнение `ingredients_base`), `recalc-all-nutrition.mjs`,
`gen-cover.mjs` (генерация обложки), `compress-covers.mjs`, `test-calc-nutrition.mjs`.
**SQL-миграции** (`scripts/*.sql`) — применять вручную в Supabase SQL Editor.

---

## 4. Структура проекта

```
src/
├── app/
│   ├── (public)/            # layout + Header/Footer; home, recipes, recipes/[slug], pricing
│   ├── (auth)/              # login, register, forgot-password, reset-password
│   ├── dashboard/           # hub, favorites, notes (+ DashboardNav, PlanBanner)
│   ├── admin/               # dashboard, recipes (list/new/[id]/edit), categories
│   ├── api/admin/           # calculate-nutrition, generate-image, translate, recipes,
│   │                        #   revalidate-recipe, upload  (все защищены api-auth)
│   ├── auth/callback/        # OAuth callback
│   ├── layout.tsx · globals.css
│   └── design-system, presentation  # внутренние dev-страницы (noindex, на старых классах)
├── components/
│   ├── ui/                  # Editorial-примитивы: Eyebrow, DropCap, Rule, PullQuote,
│   │                        #   EditorialButton, NumberDial, SectionLabel + Button, Input, Badge, Spinner
│   ├── layout/              # Header, Footer, LanguageSwitcher, ThemeToggle, ThemeProvider
│   ├── recipe/              # RecipeCard, NutritionFacts, RecipeNote, RelatedRecipes,
│   │                        #   FilterDropdown, FavoriteButton
│   ├── admin/               # RecipeForm (+ seciones), ConfirmModal, QuickCreateModal
│   └── animations/          # FadeInUp, RevealCard, PageTransition, WordReveal, CursorGlow
├── lib/
│   ├── supabase/            # client.ts, server.ts, admin.ts (service-role), middleware.ts,
│   │                        #   queries/ (recipes, categories)
│   ├── nutrition/           # parse.ts, match.ts, calculate.ts, prompt.mjs, ingredients-hash.mjs
│   ├── localized-content.ts # localizedField(record, field, locale) — RU/EN из БД
│   ├── category-types.ts · api-auth.ts · site-url.ts · translate.ts · validations.ts · utils.ts (cn)
├── i18n/                    # routing.ts (ru/en, defaultLocale ru, localePrefix "never"), request.ts
├── context/                # FavoritesContext
├── hooks/ · types/         # types/index.ts — доменные интерфейсы
└── middleware.ts
messages/ru.json · messages/en.json   # все UI/лендинг-строки (ключи RU/EN в паритете)
```

---

## 5. Модель данных (Supabase / Postgres)

Таблицы (через RLS): `profiles` (id, email, **display_name**, role 'user'|'admin', created_at),
`categories` (id, name, **name_en**, slug, type), `recipes`, `steps`, `recipe_categories` (M2M),
`favorites` (по **recipe_slug**, не id), `user_notes`, `ingredients_base` (USDA-справочник для КБЖУ).

`recipes` — ключевые поля: `title/description/note/ingredients` (+ `*_en` переводы),
`cover_image`, `published`, `featured`, `cook_time` (мин), `servings`, `nutrition` (jsonb, см.
`NutritionData` в `types/index.ts`), `created_at/updated_at`.
`steps` — `order`, `title`, `description` (+ `*_en`), `photo_url`.

**Категории — типы фильтров** (источник истины: `src/lib/category-types.ts`):
`meal_type`, `country`, `season`, `ingredient`. Legacy-типы `meal_time`/`category` выведены.

**Storage buckets** (public): `recipe-covers`, `step-photos`.
**Миграции в коде:** `scripts/migration-display-name.sql`, `migration-user-notes.sql`,
`migration-nutrition-fuzzy-match.sql`, `archive/migration-cook-time-servings.sql`.

---

## 6. AI-слой (кратко; детали — `AI_ARCHITECTURE.md`)

**Аксиома:** LLM не считает числа. Все числа (ккал, граммы) — из детерминированного источника.

- **КБЖУ:** `api/admin/calculate-nutrition` → `lib/nutrition/parse.ts` (`gpt-4o-mini` парсит
  свободный текст состава в JSON) → `match.ts` (точный + pg_trgm fuzzy матчинг в `ingredients_base`)
  → `calculate.ts` (суммирование, деление на порции, confidence). Кеш по hash состава
  (`ingredients-hash.mjs`) — не пересчитываем, если состав не менялся. Авто-расчёт при сохранении.
  Публичный блок (`NutritionFacts`) показывает только цифры; диагностика (confidence/warnings) —
  только в админке.
- **Обложки:** `api/admin/generate-image` (+ `scripts/gen-cover.mjs`) — `gpt-image-1` / `dall-e-3`,
  единый стиль (см. скилл `recipe-photo-prompts`), потом `sharp`-сжатие.
- **Перевод:** `api/admin/translate` (`gpt-4o-mini`) — RU→EN поля рецепта в `*_en`.

> Историческая заметка: `AI_ARCHITECTURE.md` планировал Claude Haiku; по факту рантайм на OpenAI.

---

## 7. Дизайн-система (editorial magazine — внедрена)

Источник истины: `tailwind.config.ts` (токены через CSS-переменные в `globals.css`, light+dark) и
`src/components/ui/`. Полный исторический хендофф: `design_handoff_editorial_redesign/README.md`.

- **Палитра (Tailwind-токены):** `paper` (фон), `crust` (карточки/асайды), `burg`/`burg-dk`
  (primary, заголовки, тёмные секции), `ochre`/`ochre-dk` (accent), `olive` (позитив ●),
  `ink` (текст), `soft`/`muted` (приглушённый/плейсхолдер), `rule` (линии),
  `soft-invert`/`rule-invert` (на тёмных секциях), `seal` (тёмный текст НА охре — стабилен в обеих темах).
- **Шрифты (всё self-hosted, без Google CDN):** display-стек — латиница **Bodoni Moda**
  (`@fontsource-variable/bodoni-moda`, локальные woff2) + кириллица/фолбэк **Playfair Display**
  (`next/font`, var `--font-playfair`). У Bodoni Moda кириллицы НЕТ (latin/latin-ext/math/symbols —
  подтверждено next/font и Fontsource), поэтому русские заголовки автоматически идут Playfair, как
  и в прототипе. Стек — в `globals.css` → `--font-display` = `"Bodoni Moda Variable", var(--font-playfair), serif`.
  `font-body` = Inter, `font-reader` = Lora (next/font; замены Work Sans/Newsreader).
- **Стиль:** прямые углы (`rounded` = 0; круглые — только FavoriteButton), без теней (глубина —
  линиями `border-rule`/`border-burg` и сменой фона), без SVG-иконок (римские цифры, ·, —, ●, →).
- **Контрастные пары:** светлая секция `bg-paper`+`text-ink` (заголовки `text-burg`, акценты `ochre`);
  тёмная секция `bg-burg`+`text-paper` (акценты `ochre`, текст `soft-invert`). На охре — `text-seal`.
- **Сетка:** контент `max-w-[1320px] mx-auto`, паддинги `px-6 md:px-10 lg:px-14`.

---

## 8. i18n

- Локали `ru` (default) / `en`, `localePrefix: "never"` — язык в cookie `NEXT_LOCALE`,
  переключатель в Header. Без URL-префиксов.
- UI/лендинг-строки — в `messages/ru.json` + `en.json`. **Ключи RU и EN держать в паритете.**
- Списки (факты, тарифы, фичи, FAQ) читать через `t.raw(key)`. Склонения — ICU-плюралы
  (`t("recipe.servingsHeading", { count })`), не самописные хелперы.
- Контент рецептов из БД — через `localizedField(record, "field", locale)` (берёт `field_en` для EN).
- Server Components: `getTranslations(ns)`. Client: `useTranslations(ns)`.

---

## 9. Соглашения по коду

- **Server Components по умолчанию.** `'use client'` — только для интерактива/хуков/GSAP.
- **Supabase:** в RSC/route — `lib/supabase/server.ts`; в браузере — `client.ts`; service-role
  (билд/скрипты/обход RLS) — `admin.ts`. Запросы — через типизированные хелперы в `lib/supabase/queries/`.
- **Типы:** без `any`. Доменные интерфейсы — в `src/types/index.ts`. Формы — Zod (`lib/validations.ts`).
- **Именование:** компоненты PascalCase; утилиты/файлы — по сложившемуся стилю папки.
- **Стили:** только Tailwind-токены новой системы; legacy-токены (cream/sand/charcoal/peach/sage)
  удалены — не возвращать. Прямые углы, без теней.
- **Классы:** склейка через `cn()` (`lib/utils.ts`, clsx + tailwind-merge).

---

## 10. Границы и «что НЕ делать»

- Не подключать платежи/кредиты/гейтинг Premium до соответствующего этапа (см. §1, стратегия).
- Не переводить админку на EN — она внутренняя, RU-only.
- Не возвращать legacy дизайн-токены и скруглённые карточки.
- Не хардкодить числа КБЖУ/калорий — только из `ingredients_base`/детерминированного расчёта.
- Не трогать без необходимости: `AI_ARCHITECTURE.md`, `PRODUCT_STRATEGY.md` (бизнес-логика),
  схему RLS (расширять, не ломать).
- Dev-страницы `src/app/design-system` и `presentation` — внутренние, на старых классах;
  можно удалить/обновить позже, на прод не влияют.

---

## 11. Карта документации

- **`CLAUDE.md`** (этот файл) — операционный контекст, статус, правила. Обновлять при изменениях.
- **`PRODUCT_STRATEGY.md`** — ЦА, монетизация, цены, риски, этапы. Бизнес-источник истины.
- **`MONETIZATION_PLAN.md`** — дизайн этапа 4: гейтинг, кредиты, схема БД, чек-лист Paddle, фазировка.
- **`BRAND_PLAN.md`** — бренд: имя (The Slow Table), слоган, голос, нейминг-процесс.
- **`AI_ARCHITECTURE.md`** — детали AI-слоя (КБЖУ, генерация, перевод).
- **`design_handoff_editorial_redesign/README.md`** — хендофф редизайна (исторический, миграция завершена).
- **`.claude/skills/`** — кастомные скиллы (генерация фото-промптов).
- **`README.md`** — быстрый старт для человека (setup, команды, деплой).

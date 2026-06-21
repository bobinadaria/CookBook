# The Slow Table — операционный бриф для Claude

> **Бренд.** Название продукта — **The Slow Table** · by Daria (домен `bydaria.kitchen`).
> Слоган: «Твоя кухня. Твоя книга. Твой AI-нутрициолог.» Дескриптор: «Создавай свою книгу
> красивых рецептов — уют дома, идеи на каждый день и точное КБЖУ от AI.» Рабочее имя
> репозитория осталось «Cookbook». Полные детали бренда — `docs/BRAND_PLAN.md`.
>
> **Что это.** Личная кулинарная книга-журнал русскоязычного автора (Дарья, Прага) с
> AI-нутрициологом. Эстетика editorial-magazine, точный КБЖУ через USDA, двуязычие RU/EN.
> Не «очередной сборник рецептов» — личный продукт-объект.
>
> **Этот файл** — главный контекст для ИИ-ассистента: актуальное состояние, следующие шаги,
> правила работы. Держи его в синхроне с кодом. Длинные тексты — в `docs/PRODUCT_STRATEGY.md`
> (бизнес) и `docs/AI_ARCHITECTURE.md` (AI-слой). Все остальные планы и стратегии — в папке `docs/`
> (карта — §11).
>
> **Обновлено:** 2026-06-21.

---

## 1. Текущее состояние (single source of truth по статусу)

**Стадия:** работающее MVP в проде на Vercel. Не pre-MVP. Монетизация ещё не подключена.

**Готово и работает:**

- **Auth** — Supabase Auth: email+пароль, Google OAuth, forgot/reset password. Middleware
  защищает `/dashboard` и `/admin`.
- **Публичный сайт** (editorial-редизайн полностью внедрён):
  - Главная — hero-разворот, колонка редактора, pull-quote, «Содержание выпуска» (featured),
    «Кухня в цифрах», тизер подписки.
  - Каталог `/recipes` — поиск + фильтры (4 типа категорий), magazine-карточки. На мобиле —
    drawer-фильтры.
  - Рецепт `/recipes/[slug]` — заголовок+метрики, состав, шаги, КБЖУ-блок, история/заметка автора +
    личная заметка, related; ISR-кэш + JSON-LD. Тип `food`/`drink` (у напитков нет КБЖУ — сознательно).
  - Подписка `/pricing` — 3 тарифа, AI-кредиты, FAQ, CTA (лендинг, без реальной оплаты).
- **Личный кабинет** `/dashboard` — «Моя книга» (свои приватные рецепты `/dashboard/recipes`
  с созданием/редактированием + избранное) и «Аккаунт» (профиль с display_name, PlanBanner —
  каркас под монетизацию, без реальных счётчиков). Premium-фичи юзера под флагом `aiEnabled`.
- **Админка** `/admin` — CRUD рецептов, шаги с фото, категории, двуязычное редактирование,
  AI-секции (см. ниже), раздел запросов ингредиентов (FuzzyMatchReview). RU-only.
- **AI-слой** (рантайм — смешанный: OpenAI + Google, не Claude):
  - КБЖУ: парсинг ингредиентов `gpt-4o-mini` (OpenAI) → матчинг в `ingredients_base` (USDA + рус-справочники,
    pg_trgm fuzzy) → детерминированный расчёт. Авто-расчёт при сохранении + кеш по hash состава.
  - Обложки: основная модель — **Imagen 4 Ultra (Google)**, фолбэк `gpt-image-1` (OpenAI);
    см. `lib/cover-image.ts` / `scripts/gen-cover.mjs`, сжатие `sharp`. (`dall-e-3` не используется.)
  - Автоперевод RU→EN полей рецепта: основной путь — **Gemini 2.5 Flash (Google)**, фолбэк `gpt-4o-mini` (OpenAI).
- **i18n** — next-intl, RU (default) + EN, переключение по cookie без URL-префикса. Весь лендинг
  и UI вынесены в `messages/`. Контент рецептов — двуязычный в БД (`*_en` поля).
- **Тёмная тема** — токены для dark есть, контраст текста-на-охре починен (токен `seal`).
  ✅ Решено (2026-05-21): «тёмные» секции-баннеры (блок КБЖУ, тёмные CTA, футер, premium-тариф)
  больше НЕ инвертируются в кремовый. Заведено отдельное стабильное семейство токенов `section`
  (`bg-section` / `text-section-fg` / `text-section-soft` / `border-section-rule`; объявлено в
  `globals.css :root`, без override в `.dark`) — эти блоки остаются тёмными в обеих темах.
  Заголовки, кнопки и бейджи по-прежнему инвертируются (светлая «пилюля» на тёмном) — это норма.
- **Своя книга рецептов** — приватные юзер-рецепты (`owner_id`/`visibility`), создание и
  редактирование из кабинета, AI-КБЖУ и AI-обложка на них под флагом `aiEnabled` (`lib/entitlements.ts`).
- **Импорт рецепта по ссылке** (Premium, под `aiEnabled`) — гибрид JSON-LD + AI-обогащение состава
  (`gpt-4o-mini`) для «голых» списков. Роуты `api/admin/import-url` и `api/recipes/import-url`.
- **Запросы ингредиентов** — если ингредиент не нашёлся в `ingredients_base`: UX-замены, алиасы,
  AI-оценка, ручной review в админке (`api/recipes/request-ingredient`, `resolve-alias`).
- **Перф** — ISR-кэш страниц рецептов, статическая прегенерация, сжатие обложек.

**НЕ сделано (намеренно отложено или в бэклоге):**

- Реальные платежи (Paddle), enforcement кредитов, реальное включение гейтинга — **не по календарю,
  а по гейту**: каркас (`lib/entitlements.ts`, флаг `MONETIZATION_ENABLED`, PlanBanner) уже есть, но
  *включать* оплату — только когда есть аудитория (промо + доказанный retention, гейт Фазы 1). Старое
  «~месяц 10» снято — см. `docs/PRODUCT_STRATEGY.md` §7 / `docs/MONETIZATION_PLAN.md` §8.
- Premium-фичи в бэклоге (хотим реализовать; на `/pricing` показаны как «скоро»): экспорт книги
  в PDF, AI-генерация рецептов для пользователя («сделай рецепт с 30 г белка»), шеринг приватного
  рецепта по ссылке. Импорт по URL — уже построен.
- «Меню недели + список покупок» — **снято с витрины** (`/pricing`): сознательно не показываем,
  пока нет в продукте (решение Дарьи 2026-06-17). Остаётся низкоприоритетной идеей на будущее.
- B2B-тариф (после того как заработает основной B2C-поток — Фаза 4).

> **Правило витрины /pricing:** не рекламируем то, чего нет. Построенное → `●`; то, что в плане,
> но не построено → метка «скоро»; то, что решили не делать → не показываем вовсе.

---

## 2. Следующие шаги (приоритезированный бэклог)

✅ **Закрыто (релизы май–июнь 2026):**
1. ~~Деплой редизайна + EN на Vercel, тёмная тема, вычитка EN~~ — в проде, live.
2. ~~AI-КБЖУ~~ — парсинг + матчинг + расчёт, `ingredients_base` расширен до ~300 ингредиентов,
   авто-расчёт и кеш по hash состава.
3. ~~Своя книга рецептов~~ — приватные юзер-рецепты + вкладки кабинета; AI-фичи под `aiEnabled`.
4. ~~Импорт по ссылке, напитки, история-вместо-описания, запросы ингредиентов~~ — закоммичены в main.
5. ~~Next.js 14 → 15~~ — миграция на async-API, закрыты high-уязвимости.
6. ~~Мобильный UX~~ — drawer-фильтры, hero, КБЖУ-блок (план — `docs/MOBILE_PLAN.md`).

**Активный бэклог (следующее):**
7. **Подготовка к монетизации** — каркас (`lib/entitlements.ts`, флаг, PlanBanner) есть; достроить
   Paddle/кредиты под флагом, *включать* — по гейту (ценность + аудитория). См. `docs/MONETIZATION_PLAN.md` §8.
8. **Premium-фичи** по одной (идеи на будущее, на `/pricing` уже помечены «скоро»): PDF-экспорт →
   AI-генерация рецептов → шеринг приватного рецепта по ссылке (импорт URL уже готов; меню недели снято).
9. **Контент** — наполнять книгу рецептами (лендинг заявляет «42 рецепта»; в каталоге растёт).
10. **UX-тестирование закрытой беты — раунд 2 пройден (2026-06-19, P2+P3).** Блок «создать свой
    рецепт» — раньше sev4-блокер у P1 — теперь оба ДОШЛИ до конца без блокеров. Новое критичное:
    приватность «своей книги» не считывается без явного объяснения (sev4, см. ниже), формулировка
    «обложки... отдельными пакетами» на `/pricing` непонятна (2/2 независимо), фраза в FAQ
    «прежде чем платить, прочитай» пугает сразу после оплаты (2/2 независимо), метафора
    «глава/номер» на главной неясна (2/3). Полный лог, тяжести 1–4 и цитаты — в
    `ux-testing/UX_Testing_Tracker.xlsx` (листы «Находки», «Go-NoGo»); живой синтез — в
    `ux-testing/UX_Findings_Summary.md`.
11. **План готов, ждёт билда:** модалка создания рецепта «имя ИЛИ ссылка» с умным автозаполнением
    + единый Premium-тизер для всех AI-фич (импорт/обложка/КБЖУ) вместо полного скрытия от Free +
    явный копирайт про приватность «своей книги» (закрывает критичный пункт 1 из UX-тестов). План
    — `docs/RECIPE_IMPORT_AND_PREMIUM_TEASERS_PLAN.md`.

> Правило: при закрытии шага — обнови §1 и §2, чтобы здесь не было устаревших данных.

---

## 3. Стек и команды

- **Framework:** Next.js 15 (App Router, async-API: `await cookies()/params`) · **TypeScript** (strict) · **Tailwind CSS**
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
│   ├── dashboard/           # «Моя книга»: recipes (new/[id] — свои рецепты) + избранное; «Аккаунт» (PlanBanner)
│   ├── admin/               # dashboard, recipes (list/new/[id]/edit), categories, запросы ингредиентов
│   ├── api/admin/           # calculate-nutrition, generate-image, translate, recipes,
│   │                        #   import-url, revalidate-recipe, upload  (все защищены api-auth)
│   ├── api/recipes/         # calculate-nutrition, generate-image, import-url, request-ingredient,
│   │                        #   resolve-alias  (юзер-фичи, под aiEnabled)
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

Таблицы (через RLS): `profiles` (id, email, **display_name**, role 'user'|'admin', **plan**, created_at),
`categories` (id, name, **name_en**, slug, type), `recipes`, `steps`, `recipe_categories` (M2M),
`favorites` (по **recipe_slug**, не id), `user_notes`, `ingredients_base` (USDA-справочник для КБЖУ),
`ingredient_requests` (запросы/алиасы ненайденных ингредиентов).

`recipes` — ключевые поля: `title/description/note/ingredients` (+ `*_en` переводы),
`cover_image`, `published`, `featured`, `cook_time` (мин), `servings`, `recipe_type` (`food`/`drink`),
`owner_id`/`visibility` (юзер-рецепты), `nutrition` (jsonb, см. `NutritionData` в `types/index.ts`),
`created_at/updated_at`.
`steps` — `order`, `title`, `description` (+ `*_en`), `photo_url`.

**Категории — типы фильтров** (источник истины: `src/lib/category-types.ts`):
`meal_type`, `country`, `season`, `ingredient`. Legacy-типы `meal_time`/`category` выведены.

**Storage buckets** (public): `recipe-covers`, `step-photos`.
**Миграции в коде** — все `scripts/migration-*.sql` (display-name, user-notes, nutrition-fuzzy-match,
recipe-en-fields, recipe-type, user-recipes, ingredient-aliases, ingredient-requests; архивные —
`scripts/archive/`). Применять вручную в Supabase SQL Editor.

---

## 6. AI-слой (кратко; детали — `docs/AI_ARCHITECTURE.md`)

**Аксиома:** LLM не считает числа. Все числа (ккал, граммы) — из детерминированного источника.

- **КБЖУ:** `api/admin/calculate-nutrition` → `lib/nutrition/parse.ts` (`gpt-4o-mini` парсит
  свободный текст состава в JSON) → `match.ts` (точный + pg_trgm fuzzy матчинг в `ingredients_base`)
  → `calculate.ts` (суммирование, деление на порции, confidence). Кеш по hash состава
  (`ingredients-hash.mjs`) — не пересчитываем, если состав не менялся. Авто-расчёт при сохранении.
  Публичный блок (`NutritionFacts`) показывает только цифры; диагностика (confidence/warnings) —
  только в админке.
- **Обложки:** `api/admin/generate-image` (+ `lib/cover-image.ts`, `scripts/gen-cover.mjs`) — основная
  модель **Imagen 4 Ultra (Google)**, фолбэк `gpt-image-1` (OpenAI); квадрат 1:1, `sampleCount: 1`
  (одна картинка на запрос, без скрытого множителя). Единый стиль (см. скилл `recipe-photo-prompts`),
  потом `sharp`-сжатие. `dall-e-3` не используется.
- **Перевод:** `api/admin/translate` (`lib/translate.ts`) — основной путь **Gemini 2.5 Flash (Google)**,
  фолбэк `gpt-4o-mini` (OpenAI); RU→EN поля рецепта в `*_en`.

> Историческая заметка: `docs/AI_ARCHITECTURE.md` планировал Claude Haiku; по факту КБЖУ-парсинг
> на OpenAI (`gpt-4o-mini`), а обложки и перевод — на Google (Imagen 4 Ultra / Gemini 2.5 Flash) с
> OpenAI-фолбэками. ⚠️ Оба сервиса висят на одном Google-проекте: его spend-cap (429 RESOURCE_EXHAUSTED)
> глушит и обложки, и перевод разом — расход смотреть в **Google Cloud Billing**, не в OpenAI Usage.

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
- Не трогать без необходимости: `docs/AI_ARCHITECTURE.md`, `docs/PRODUCT_STRATEGY.md` (бизнес-логика),
  схему RLS (расширять, не ломать).
- Dev-страницы `src/app/design-system` и `presentation` — внутренние, на старых классах;
  можно удалить/обновить позже, на прод не влияют.

---

## 11. Карта документации

Операционный контекст (`CLAUDE.md`) и `README.md` — в корне; остальные планы и стратегии — в папке `docs/`.

- **`CLAUDE.md`** (этот файл, в корне) — операционный контекст, статус, правила. Обновлять при изменениях.
- **`README.md`** (в корне) — быстрый старт для человека (setup, команды, деплой).
- **`docs/PRODUCT_STRATEGY.md`** — ЦА, монетизация, цены, риски, этапы. Бизнес-источник истины.
- **`docs/MONETIZATION_PLAN.md`** — дизайн монетизации: гейтинг, кредиты, схема БД, чек-лист Paddle, фазировка.
- **`docs/BRAND_PLAN.md`** — бренд: имя (The Slow Table), слоган, голос, нейминг-процесс.
- **`docs/AI_ARCHITECTURE.md`** — детали AI-слоя (КБЖУ, генерация, перевод, фолбэки).
- **`docs/FEATURE_USER_RECIPES.md`** — фича «Своя книга рецептов»: приватные юзер-рецепты, кабинет.
- **`docs/LAUNCH_PLAN.md`** — план запуска и закрытой беты.
- **`docs/MOBILE_PLAN.md`** — аудит и план мобильного UX.
- **`docs/RECIPE_IMPORT_AND_PREMIUM_TEASERS_PLAN.md`** — план: модалка имя/ссылка, Premium-тизеры,
  приватность копирайта (готов, ждёт билда).
- **`ux-testing/`** — кит UX-тестирования закрытой беты: `UX_Testing_Plan.docx` (цели, go/no-go),
  `session-script.md` (сценарий звонка), `UX_Testing_Tracker.xlsx` (Участники/Находки/Сводка/Go-NoGo —
  живой лог по всем сессиям), `UX_Findings_Summary.md` (живой синтез: критично/единично/off-target —
  дополняется после каждого раунда, не создавать новый файл под каждый P-раунд).
- **`design_handoff_editorial_redesign/README.md`** — хендофф редизайна (исторический, миграция завершена).
- **`.claude/skills/`** — кастомные скиллы (генерация фото-промптов).

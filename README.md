# Cookbook — «by Daria»

Личная кулинарная книга-журнал с AI-нутрициологом. Next.js 14 (App Router) + Supabase + OpenAI,
двуязычие RU/EN, editorial-magazine дизайн. Прод на Vercel.

> Полный контекст проекта, актуальный статус и правила разработки — в **`CLAUDE.md`**.
> Бизнес-стратегия — `PRODUCT_STRATEGY.md`, AI-слой — `AI_ARCHITECTURE.md`.

## Стек

Next.js 14 · TypeScript · Tailwind CSS · Supabase (Postgres/Auth/Storage) · OpenAI ·
next-intl · next-themes · GSAP · Zod · deploy на Vercel.

## Быстрый старт

```bash
npm install
cp .env.example .env.local   # затем заполни ключи (см. ниже)
npm run dev                  # http://localhost:3000
```

### Переменные окружения (`.env.local`)

```
NEXT_PUBLIC_SITE_URL=          # базовый URL (http://localhost:3000 локально)
NEXT_PUBLIC_SUPABASE_URL=      # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Supabase anon key
SUPABASE_SERVICE_ROLE_KEY=     # service role (билд/скрипты, обход RLS) — секрет
OPENAI_API_KEY=                # КБЖУ-парсинг, перевод, генерация обложек
GOOGLE_AI_API_KEY=             # вспомогательный AI
USDA_API_KEY=                  # наполнение справочника ингредиентов
```

## Команды

```bash
npm run dev      # дев-сервер с hot-reload
npm run build    # прод-сборка (на этапе static generation тянет Supabase)
npm run start    # запуск прод-сборки локально
npm run lint     # ESLint
npx tsc --noEmit # проверка типов
```

> Не запускай `dev` и `build`/`start` одновременно — общий каталог `.next` испортится.
> При странных ошибках сборки: `rm -rf .next && npm run build`. Если порт занят:
> `lsof -ti:3000 | xargs kill` или `npm run start -- -p 4000`.

## Скрипты и миграции (`scripts/`)

- `seed-ingredients.mjs` — наполнение `ingredients_base` (USDA + рус-справочники).
- `recalc-all-nutrition.mjs` — пересчёт КБЖУ по всем рецептам.
- `gen-cover.mjs` / `compress-covers.mjs` — генерация и сжатие обложек.
- `test-calc-nutrition.mjs` — проверка расчёта КБЖУ.
- `*.sql` — миграции БД, применять вручную в Supabase SQL Editor.

Запуск: `node scripts/<файл>.mjs` (скрипты читают `.env.local`).

## Структура

Кратко: `src/app/(public|auth)`, `src/app/dashboard`, `src/app/admin`, `src/app/api/admin`,
`src/components/{ui,layout,recipe,admin,animations}`, `src/lib/{supabase,nutrition}`,
`messages/{ru,en}.json`. Подробная карта — в `CLAUDE.md` §4.

## Деплой

Vercel (Hobby). Подключить env-переменные в настройках проекта, затем `git push` в основную
ветку — Vercel соберёт и задеплоит автоматически.

## Документация

| Файл | О чём |
|---|---|
| `CLAUDE.md` | Операционный контекст: статус, следующие шаги, правила, схема данных |
| `PRODUCT_STRATEGY.md` | ЦА, монетизация, цены, риски, этапы |
| `AI_ARCHITECTURE.md` | Архитектура AI-слоя (КБЖУ, генерация, перевод) |
| `design_handoff_editorial_redesign/README.md` | Хендофф редизайна (исторический) |

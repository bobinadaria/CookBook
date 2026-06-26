# Чеклист запуска — The Slow Table
> Цель: запустить реальную оплату к 3 июля 2026. Всё, что ниже — одноразовые шаги в нужном порядке.

---

## Шаг 1 — Stripe: создать продукты и цены (20 мин)

Заходи на **dashboard.stripe.com → Catalogue → Products** и создай 5 продуктов:

| Название в Stripe | Тип | Цена | Период |
|---|---|---|---|
| The Slow Table — Premium | Recurring | €7.90 | Monthly |
| The Slow Table — Lifetime | One-time | €79 | — |
| AI Covers Pack S | One-time | €4.90 | — |
| AI Covers Pack M | One-time | €9.90 | — |
| AI Covers Pack L | One-time | €19.90 | — |

После создания каждого продукта скопируй **Price ID** (начинается на `price_...`). Понадобится в Шаге 3.

> ⚠️ Начинай в **Test mode** (переключатель сверху слева). Перейдёшь в Live только после успешного тест-платежа.

---

## Шаг 2 — Stripe: настроить Webhook (5 мин)

**Developers → Webhooks → Add endpoint:**

- URL: `https://bydaria.kitchen/api/webhooks/stripe`
- Events: выбери **`checkout.session.completed`** и **`customer.subscription.deleted`**

После создания скопируй **Signing secret** (начинается на `whsec_...`).

---

## Шаг 3 — Vercel: добавить переменные окружения (10 мин)

**Vercel Dashboard → проект → Settings → Environment Variables → Add**

Добавь все восемь переменных (Environment: Production):

```
STRIPE_SECRET_KEY               = sk_test_...   (из Stripe Dashboard → API Keys)
STRIPE_WEBHOOK_SECRET           = whsec_...     (из Шага 2)
STRIPE_PRICE_PREMIUM_MONTHLY    = price_...     (Premium Monthly из Шага 1)
STRIPE_PRICE_LIFETIME           = price_...     (Lifetime из Шага 1)
STRIPE_PRICE_PACK_S             = price_...     (Pack S из Шага 1)
STRIPE_PRICE_PACK_M             = price_...     (Pack M из Шага 1)
STRIPE_PRICE_PACK_L             = price_...     (Pack L из Шага 1)
NEXT_PUBLIC_PAYMENTS_ENABLED    = true
```

После добавления — **Redeploy** (Deployments → последний деплой → Redeploy).

---

## Шаг 4 — Supabase: прогнать SQL-миграции (5 мин)

**Supabase Dashboard → SQL Editor** — выполни по очереди содержимое файлов:

1. `scripts/migration-stripe-fields.sql` — добавляет колонки `stripe_customer_id` и `stripe_subscription_id` в таблицу `profiles`
2. `scripts/migration-protect-plan-column.sql` — **критично для безопасности**: блокирует изменение тарифа клиентом напрямую (без этого любой может выдать себе Premium через консоль браузера)

Если уже прогоняла эти файлы раньше — повторный запуск безопасен (все команды идемпотентны).

---

## Шаг 5 — Тест-платёж (10 мин)

1. Зайди на сайт под своим аккаунтом
2. Перейди на `/pricing` и нажми «Оформить Premium»
3. Stripe откроет страницу оплаты — введи тестовую карту: **4242 4242 4242 4242**, любой срок, любой CVC
4. После оплаты должна открыться `/pricing/success?plan=premium`
5. Через 10–30 секунд зайди в Supabase → `profiles` → проверь что `plan` = `premium`

Если всё сработало — готово к переходу в Live.

---

## Шаг 6 — Переключить на Live (5 мин)

1. В Stripe переключи на **Live mode**
2. Обнови в Vercel:
   - `STRIPE_SECRET_KEY` → `sk_live_...` (из Stripe Live → API Keys)
   - `STRIPE_PRICE_*` → Live Price IDs (создай те же 5 продуктов в Live mode или они уже там, если Stripe их перенёс)
   - `STRIPE_WEBHOOK_SECRET` → Live webhook secret (повтори Шаг 2 в Live mode)
3. Redeploy

---

## Что уже готово в коде (ничего не нужно трогать)

- Checkout session API (`/api/payments/create-checkout-session`) — создаёт Stripe сессию и редиректит
- Webhook handler (`/api/webhooks/stripe`) — обрабатывает `checkout.session.completed` и `customer.subscription.deleted`
- Даунгрейд на Free — отменяет Stripe-подписку через API
- Success-страницы (`/pricing/success`)
- Кредитная книга обложек (`credit_ledger`, `spend_cover_credit`)
- Флаг `NEXT_PUBLIC_PAYMENTS_ENABLED` — включает UI оплаты (уже проставляешь в Шаге 3)

---

## ⚠️ Известная проблема — загрузка без VPN

2 из 3 тестеров (Егор, Маша) упоминали трудности с загрузкой без VPN. Возможная причина — Vercel CDN заблокирован у некоторых провайдеров в РФ/UA. Это не решается кодом. Варианты:

- Временно оставить как есть (если целевая аудитория в основном в Европе)
- Настроить custom domain на Cloudflare proxy вместо Vercel DNS — Cloudflare меньше блокируется

---

## После запуска

- Следить за Stripe Dashboard → Events (убедиться, что webhook получает события)
- Следить за Vercel Logs → `/api/webhooks/stripe` (нет ли ошибок)
- Установить лимиты в OpenAI и Google Cloud Billing (если ещё не стоят)

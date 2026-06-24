/**
 * Серверный Stripe-клиент. Импортировать ТОЛЬКО из серверного кода
 * (route handlers, server actions, RSC) — ни в коем случае не из 'use client'.
 *
 * Price ID-ы хранятся в env и меняются между тест/прод окружениями
 * (STRIPE_PRICE_PREMIUM_MONTHLY и т.д.). Маппинг — в getPriceId() ниже.
 */
import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("[stripe] Missing STRIPE_SECRET_KEY env variable");
  }
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}

/** @deprecated use getStripe() */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe];
  },
});

// ─── Price ID маппинг ────────────────────────────────────────────────────────

export type StripePriceKey =
  | "premium_monthly"
  | "lifetime"
  | "pack_s"
  | "pack_m"
  | "pack_l";

/**
 * Возвращает Stripe Price ID для ключа.
 * Бросает ошибку, если env-переменная не задана — это намеренно:
 * лучше упасть с ясным сообщением, чем создать сессию без цены.
 */
export function getPriceId(key: StripePriceKey): string {
  const map: Record<StripePriceKey, string | undefined> = {
    premium_monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
    lifetime:        process.env.STRIPE_PRICE_LIFETIME,
    pack_s:          process.env.STRIPE_PRICE_PACK_S,
    pack_m:          process.env.STRIPE_PRICE_PACK_M,
    pack_l:          process.env.STRIPE_PRICE_PACK_L,
  };
  const id = map[key];
  if (!id) {
    throw new Error(`[stripe] Missing env variable for price key: ${key}`);
  }
  return id;
}

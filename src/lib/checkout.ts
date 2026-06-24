/**
 * Единая точка интеграции платёжной системы — Stripe Hosted Checkout.
 *
 * Флаг NEXT_PUBLIC_PAYMENTS_ENABLED управляет включением оплаты:
 *   false (по умолчанию) → модалка показывает заглушку «скоро»
 *   true                 → реальный чекаут через Stripe
 *
 * Как подключить (один раз):
 *   1. Выставить NEXT_PUBLIC_PAYMENTS_ENABLED=true в .env.local
 *   2. Прописать STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET и STRIPE_PRICE_* в .env.local
 *
 * Больше нигде по коду менять ничего не нужно.
 */

/** Включена ли реальная оплата. Public-флаг — читается и на клиенте. */
export const PAYMENTS_ENABLED = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";

/** Что покупает пользователь — план подписки или пакет AI-картинок. */
export type CheckoutItem =
  | { kind: "plan"; plan: "free" | "premium" | "lifetime"; cadence?: "monthly" | "annual"; title: string; price: string }
  | { kind: "pack"; size: string; title: string; price: string };

/**
 * Запускает Stripe Hosted Checkout: создаёт сессию на сервере и редиректит
 * пользователя на страницу оплаты Stripe. После оплаты Stripe перенаправляет
 * на /pricing/success, а вебхук обновляет profiles.plan в Supabase.
 *
 * Вызывается из CheckoutModal ТОЛЬКО когда PAYMENTS_ENABLED === true.
 * Параметр `_container` оставлен для совместимости с интерфейсом, не используется.
 */
export async function mountCheckout(
  _container: HTMLElement,
  item: CheckoutItem,
): Promise<void> {
  const res = await fetch("/api/payments/create-checkout-session", {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body:    JSON.stringify({ item }),
  });

  if (res.status === 401) {
    // Незалогиненный пользователь — отправляем на логин
    window.location.href = "/login?redirect=/pricing";
    return;
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(data.message ?? "Failed to create checkout session");
  }

  const { url } = await res.json() as { url: string };
  window.location.href = url;
}

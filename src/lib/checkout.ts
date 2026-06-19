/**
 * Единая точка интеграции платёжной системы (Paddle и т.п.).
 *
 * Сейчас оплата НЕ подключена: PAYMENTS_ENABLED=false → модалка показывает
 * заглушку «оплата скоро». Чтобы запустить платежи позже, нужно ровно две вещи —
 * и БОЛЬШЕ нигде по коду менять ничего не нужно:
 *   1) выставить env  NEXT_PUBLIC_PAYMENTS_ENABLED=true;
 *   2) реализовать mountCheckout() — поднять чекаут провайдера в переданном
 *      контейнере для выбранного товара (план или пакет картинок).
 *
 * Кнопки тарифов и пакетов уже активны и вызывают эту логику через CheckoutModal.
 */

/** Включена ли реальная оплата. Public-флаг — читается и на клиенте. */
export const PAYMENTS_ENABLED = process.env.NEXT_PUBLIC_PAYMENTS_ENABLED === "true";

/** Что покупает пользователь — план подписки или пакет AI-картинок. */
export type CheckoutItem =
  | { kind: "plan"; plan: "free" | "premium" | "lifetime"; title: string; price: string }
  | { kind: "pack"; size: string; title: string; price: string };

/**
 * TODO(payments): поднять чекаут платёжной системы внутри `container` для `item`.
 * Вызывается из CheckoutModal ТОЛЬКО когда PAYMENTS_ENABLED === true.
 * Пример (Paddle inline):
 *   Paddle.Checkout.open({ items: [...mapItem(item)], settings: { frameTarget: container.id } })
 * Сейчас — заглушка: пока платежи не подключены, бросаем ошибку, и модалка
 * показывает сообщение «оплата скоро».
 */
export async function mountCheckout(
  container: HTMLElement,
  item: CheckoutItem,
): Promise<void> {
  void container;
  void item;
  throw new Error("Payments not connected yet");
}

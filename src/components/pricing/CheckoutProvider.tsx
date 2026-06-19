"use client";

/**
 * Контекст оформления покупки для /pricing. Держит выбранный товар и рендерит
 * CheckoutModal. Кнопки тарифов/пакетов вызывают open(item).
 *
 * Серверная страница оборачивает свой контент в <CheckoutProvider> — children
 * остаются RSC, а кнопки внутри (клиентские) получают доступ к open().
 */
import { createContext, useContext, useState } from "react";
import CheckoutModal from "./CheckoutModal";
import type { CheckoutItem } from "@/lib/checkout";

interface CheckoutCtx {
  open: (item: CheckoutItem) => void;
}

const Ctx = createContext<CheckoutCtx | null>(null);

export function useCheckout(): CheckoutCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCheckout must be used within <CheckoutProvider>");
  return c;
}

export default function CheckoutProvider({ children }: { children: React.ReactNode }) {
  const [item, setItem] = useState<CheckoutItem | null>(null);
  return (
    <Ctx.Provider value={{ open: setItem }}>
      {children}
      {item && <CheckoutModal item={item} onClose={() => setItem(null)} />}
    </Ctx.Provider>
  );
}

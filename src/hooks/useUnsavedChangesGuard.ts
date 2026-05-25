"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Pending = { type: "href"; href: string } | { type: "back" } | null;

/**
 * Предупреждение о несохранённых изменениях на странице создания/редактирования.
 *
 * Пока `isDirty` истинно:
 *  - перехватывает клики по внутренним ссылкам (шапка сайта, «← Все мои рецепты»,
 *    логотип, любые <a>) в capture-фазе и показывает модалку вместо ухода;
 *  - вешает `beforeunload` на закрытие/перезагрузку вкладки или переход по
 *    внешнему адресу (нативный диалог браузера).
 *
 * `guardedBack()` — обёртка для кнопки «Отмена» (router.back() через подтверждение).
 * Программная навигация после успешного сохранения не блокируется: это не клик
 * по ссылке и не выгрузка страницы.
 */
export function useUnsavedChangesGuard(isDirty: boolean) {
  const router = useRouter();
  const [promptOpen, setPromptOpen] = useState(false);
  const pendingRef = useRef<Pending>(null);
  const bypassRef = useRef(false);

  // Закрытие / перезагрузка вкладки, переход по внешней ссылке.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  // Перехват кликов по внутренним ссылкам (capture, чтобы опередить Next <Link>).
  useEffect(() => {
    if (!isDirty) return;
    const onClick = (e: MouseEvent) => {
      if (bypassRef.current) return;
      // Не трогаем клики с модификаторами (открытие в новой вкладке) и не-левую кнопку.
      if (
        e.defaultPrevented ||
        e.button !== 0 ||
        e.metaKey ||
        e.ctrlKey ||
        e.shiftKey ||
        e.altKey
      )
        return;
      const el = e.target as HTMLElement | null;
      const anchor = el?.closest("a");
      if (!anchor) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:"))
        return;
      // target="_blank" и пр. — пусть открывается как есть.
      if (anchor.target && anchor.target !== "_self") return;
      e.preventDefault();
      e.stopPropagation();
      pendingRef.current = { type: "href", href };
      setPromptOpen(true);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [isDirty]);

  /** Для кнопки «Отмена»: уйти назад, но с подтверждением, если есть правки. */
  const guardedBack = useCallback(() => {
    if (!isDirty) {
      router.back();
      return;
    }
    pendingRef.current = { type: "back" };
    setPromptOpen(true);
  }, [isDirty, router]);

  /** Пользователь подтвердил уход — выполняем отложенную навигацию. */
  const confirmLeave = useCallback(() => {
    bypassRef.current = true;
    setPromptOpen(false);
    const p = pendingRef.current;
    pendingRef.current = null;
    if (!p) return;
    if (p.type === "back") router.back();
    else router.push(p.href);
  }, [router]);

  /** Пользователь решил остаться — просто закрываем модалку. */
  const cancelLeave = useCallback(() => {
    pendingRef.current = null;
    setPromptOpen(false);
  }, []);

  return { promptOpen, guardedBack, confirmLeave, cancelLeave };
}

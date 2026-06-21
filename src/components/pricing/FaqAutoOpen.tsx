"use client";

import { useEffect } from "react";

/**
 * Если на `/pricing` приходят по ссылке с якорем (например `#faq-usda` — со
 * страницы рецепта или с главной, где слово USDA ведёт на объяснение в FAQ),
 * нужный `<details>` сам по себе не раскрывается — браузер просто скроллит к
 * закрытому аккордеону. Этот компонент раскрывает его и докручивает после
 * раскрытия (высота блока меняется, скролл браузера до этого момента неточный).
 * Слушает и `hashchange` — на случай повторного клика по той же ссылке без
 * перезагрузки страницы.
 */
export default function FaqAutoOpen() {
  useEffect(() => {
    const openFromHash = () => {
      const hash = window.location.hash.slice(1);
      if (!hash) return;
      const el = document.getElementById(hash);
      if (el instanceof HTMLDetailsElement) {
        el.open = true;
        requestAnimationFrame(() => el.scrollIntoView({ behavior: "smooth", block: "center" }));
      }
    };
    openFromHash();
    window.addEventListener("hashchange", openFromHash);
    return () => window.removeEventListener("hashchange", openFromHash);
  }, []);

  return null;
}

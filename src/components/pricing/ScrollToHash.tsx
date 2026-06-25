"use client";

/**
 * При загрузке страницы с hash-якорем (#covers и др.):
 * сначала прыгает наверх, показывая шапку страницы,
 * затем плавно доскролливает к целевому элементу.
 */
import { useEffect } from "react";

export default function ScrollToHash() {
  useEffect(() => {
    const hash = window.location.hash; // e.g. "#covers"
    if (!hash) return;

    const target = document.querySelector(hash);
    if (!target) return;

    // 1. Сразу прыгаем наверх (без анимации)
    window.scrollTo({ top: 0, behavior: "instant" });

    // 2. Через паузу плавно скролим к цели
    const timer = setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 600);

    return () => clearTimeout(timer);
  }, []);

  return null;
}

"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import RecipeCard from "@/components/recipe/RecipeCard";
import FavoriteButton from "@/components/recipe/FavoriteButton";
import FadeInUp from "@/components/animations/FadeInUp";
import { FavoritesProvider } from "@/context/FavoritesContext";

/* ── Helpers ────────────────────────────────────────────────────────────────── */

function Section({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-8 border-b border-charcoal/5 px-10 py-14">
      <h2 className="font-serif text-3xl text-charcoal mb-8">{title}</h2>
      {children}
    </section>
  );
}

function Swatch({ name, value, className }: { name: string; value: string; className: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className={cn("w-20 h-20 rounded-2xl shadow-sm border border-charcoal/5", className)} />
      <span className="text-xs font-medium text-charcoal">{name}</span>
      <span className="text-[10px] text-charcoal/40 font-mono">{value}</span>
    </div>
  );
}

function ToggleDemo({ label, defaultOn, color }: { label: string; defaultOn: boolean; color: string }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <label className="flex items-center gap-3 cursor-pointer">
      <div
        role="switch"
        aria-checked={on}
        tabIndex={0}
        onClick={() => setOn((v) => !v)}
        className={cn(
          "w-11 h-[26px] rounded-full transition-colors duration-200 relative cursor-pointer shrink-0",
          on ? color : "bg-[#d5d0ca]"
        )}
      >
        <span
          className={cn(
            "absolute top-[3px] left-[3px] w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200",
            on && "translate-x-[18px]"
          )}
        />
      </div>
      <span className="text-sm text-charcoal/60">{label}</span>
    </label>
  );
}

/* ── Dummy recipe for cards ─────────────────────────────────────────────────── */

const DUMMY_RECIPE = {
  id: "demo-1",
  title: "Тарт с инжиром и рикоттой",
  slug: "demo-tart",
  cover_image: null as string | null,
};

const DUMMY_RECIPE_2 = {
  id: "demo-2",
  title: "Куриные крылышки с мёдом",
  slug: "demo-wings",
  cover_image: null as string | null,
};

/* ── Page ───────────────────────────────────────────────────────────────────── */

export default function DesignSystemPage() {
  return (
    <FavoritesProvider>
      <div className="bg-cream min-h-screen">
        {/* Header */}
        <div className="px-10 py-10 border-b border-charcoal/5">
          <span className="font-handwritten text-peach text-xl block mb-2">дизайн-система</span>
          <h1 className="font-serif text-5xl text-charcoal mb-3">CookBook UI Kit</h1>
          <p className="text-charcoal/50 text-sm max-w-lg">
            Все компоненты, токены и стили проекта в одном месте.
            Каждый элемент показан в разных состояниях.
          </p>
        </div>

        {/* ── Colors ─────────────────────────────────────────────────────────── */}
        <Section id="colors" title="Цвета">
          <div className="flex flex-wrap gap-6">
            <Swatch name="Cream" value="#FDFAF5" className="bg-cream" />
            <Swatch name="Sand" value="#F2E8DC" className="bg-sand" />
            <Swatch name="Charcoal" value="#1C1917" className="bg-charcoal" />
            <Swatch name="Peach" value="#E8956D" className="bg-peach" />
            <Swatch name="Peach Dark" value="#D4956A" className="bg-peach-dark" />
            <Swatch name="Sage" value="#8BAF8C" className="bg-sage" />
            <Swatch name="Sage Dark" value="#6B9470" className="bg-sage-dark" />
          </div>

          <h3 className="font-serif-display text-lg text-charcoal mt-10 mb-4">Прозрачности Charcoal</h3>
          <div className="flex flex-wrap gap-4">
            {[5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 80].map((opacity) => (
              <div key={opacity} className="flex flex-col items-center gap-1">
                <div
                  className="w-14 h-14 rounded-xl border border-charcoal/5"
                  style={{ backgroundColor: `rgba(28,25,23,${opacity / 100})` }}
                />
                <span className="text-[10px] text-charcoal/40 font-mono">{opacity}%</span>
              </div>
            ))}
          </div>
        </Section>

        {/* ── Typography ─────────────────────────────────────────────────────── */}
        <Section id="typography" title="Типографика">
          <div className="space-y-10">
            {/* Serif — H1, H2 */}
            <div>
              <p className="text-xs text-charcoal/40 uppercase tracking-wider mb-3">
                Cormorant Garamond &mdash; Заголовки H1, H2
              </p>
              <div className="space-y-3 bg-sand/40 rounded-2xl p-6">
                <h1 className="font-serif text-6xl text-charcoal">H1 — Я готовлю для тех, кого люблю</h1>
                <h2 className="font-serif text-4xl text-charcoal">H2 — Самые любимые блюда</h2>
              </div>
            </div>

            {/* Serif Display — H3, H4 */}
            <div>
              <p className="text-xs text-charcoal/40 uppercase tracking-wider mb-3">
                DM Serif Display &mdash; Заголовки H3, H4
              </p>
              <div className="space-y-3 bg-sand/40 rounded-2xl p-6">
                <h3 className="font-serif-display text-2xl text-charcoal">H3 — Приготовление</h3>
                <h4 className="font-serif-display text-xl text-charcoal">H4 — Шаг первый</h4>
              </div>
            </div>

            {/* Handwritten */}
            <div>
              <p className="text-xs text-charcoal/40 uppercase tracking-wider mb-3">
                Satisfy &mdash; Рукописный акцент
              </p>
              <div className="space-y-3 bg-sand/40 rounded-2xl p-6">
                <p className="font-handwritten text-3xl text-charcoal/70">добро пожаловать</p>
                <p className="font-handwritten text-2xl text-peach">из книги</p>
                <p className="font-handwritten text-xl text-sage">история блюда</p>
              </div>
            </div>

            {/* Body */}
            <div>
              <p className="text-xs text-charcoal/40 uppercase tracking-wider mb-3">
                Plus Jakarta Sans &mdash; Основной текст / UI
              </p>
              <div className="space-y-3 bg-sand/40 rounded-2xl p-6">
                <p className="text-lg text-charcoal">
                  Текст 18px — Для мужа, который всегда просит «как в прошлый раз».
                </p>
                <p className="text-base text-charcoal/70">
                  Текст 16px — Это личная книга рецептов. Каждый рецепт здесь с историей.
                </p>
                <p className="text-sm text-charcoal/50">
                  Текст 14px — Нажми на сердечко, чтобы сохранить рецепт
                </p>
                <p className="text-xs text-charcoal/40">
                  Текст 12px — Категории • 5 рецептов • Все рецепты →
                </p>
                <p className="text-xs text-charcoal/40 uppercase tracking-wider">
                  LABEL — uppercase tracking-wider
                </p>
              </div>
            </div>

            {/* Shimmer */}
            <div>
              <p className="text-xs text-charcoal/40 uppercase tracking-wider mb-3">
                Shimmer Text &mdash; Анимированный акцент
              </p>
              <div className="bg-sand/40 rounded-2xl p-6">
                <span className="font-serif text-5xl">
                  <em className="not-italic shimmer-text">люблю</em>
                </span>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Buttons ────────────────────────────────────────────────────────── */}
        <Section id="buttons" title="Кнопки">
          <div className="space-y-8">
            {/* Primary */}
            <div>
              <p className="text-xs text-charcoal/40 uppercase tracking-wider mb-4">Primary</p>
              <div className="flex flex-wrap items-center gap-4">
                <button className="bg-charcoal text-cream px-8 py-4 rounded-full text-sm font-medium hover:bg-peach transition-colors duration-300">
                  Посмотреть рецепты
                </button>
                <button className="bg-charcoal text-cream px-8 py-3.5 rounded-full text-sm font-medium hover:bg-peach transition-colors">
                  Создать рецепт
                </button>
                <button className="bg-charcoal text-cream px-6 py-3 rounded-full text-sm font-medium hover:bg-peach transition-colors">
                  Сохранить
                </button>
                <button className="bg-charcoal text-cream px-8 py-3.5 rounded-full text-sm font-medium opacity-50 cursor-not-allowed">
                  Disabled
                </button>
              </div>
            </div>

            {/* Primary with arrow */}
            <div>
              <p className="text-xs text-charcoal/40 uppercase tracking-wider mb-4">Primary с иконкой</p>
              <div className="flex flex-wrap items-center gap-4">
                <button className="inline-flex items-center gap-3 bg-charcoal text-cream px-8 py-4 rounded-full text-sm font-medium hover:bg-peach transition-colors duration-300">
                  Посмотреть рецепты
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Secondary / Outline */}
            <div>
              <p className="text-xs text-charcoal/40 uppercase tracking-wider mb-4">Secondary / Outline</p>
              <div className="flex flex-wrap items-center gap-4">
                <button className="px-6 py-3.5 rounded-full text-sm text-charcoal/50 hover:text-charcoal border border-charcoal/10 hover:border-charcoal/25 transition-colors">
                  Отмена
                </button>
                <button className="px-6 py-3.5 rounded-full text-sm text-charcoal/50 border border-charcoal/10 opacity-50 cursor-not-allowed">
                  Disabled
                </button>
              </div>
            </div>

            {/* Text / Link */}
            <div>
              <p className="text-xs text-charcoal/40 uppercase tracking-wider mb-4">Text / Link</p>
              <div className="flex flex-wrap items-center gap-6">
                <button className="text-sm text-charcoal/40 hover:text-peach transition-colors duration-200">
                  Все рецепты &rarr;
                </button>
                <button className="font-handwritten text-2xl text-charcoal/40 hover:text-peach transition-colors duration-200">
                  смотреть все &rarr;
                </button>
                <button className="text-sm text-peach hover:underline">
                  Перейти к рецептам &rarr;
                </button>
                <Link href="#" className="text-sm text-charcoal/50 hover:text-charcoal transition-colors">
                  &larr; Все рецепты
                </Link>
              </div>
            </div>

            {/* Dashed / Add */}
            <div>
              <p className="text-xs text-charcoal/40 uppercase tracking-wider mb-4">Dashed / Добавить</p>
              <div className="flex flex-col gap-3 max-w-md">
                <button className="flex items-center gap-2 text-sm text-charcoal/50 hover:text-peach transition-colors border border-dashed border-charcoal/15 hover:border-peach/40 rounded-xl px-4 py-3 w-full justify-center">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Добавить шаг
                </button>
                <button className="flex items-center gap-2 text-xs text-charcoal/40 hover:text-peach transition-colors border border-dashed border-charcoal/15 hover:border-peach/40 rounded-xl px-3 py-2">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Добавить фото
                </button>
              </div>
            </div>

            {/* Tag / Category pill */}
            <div>
              <p className="text-xs text-charcoal/40 uppercase tracking-wider mb-4">Tag / Категория</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 rounded-full text-xs font-medium border bg-charcoal text-cream border-charcoal">
                  Выбрано
                </span>
                <span className="px-3 py-1.5 rounded-full text-xs font-medium border bg-transparent text-charcoal/50 border-charcoal/15 hover:border-charcoal/30 hover:text-charcoal cursor-pointer transition-all">
                  Не выбрано
                </span>
                <span className="text-xs font-medium bg-sand text-charcoal px-3 py-1 rounded-full">
                  Label
                </span>
              </div>
            </div>

            {/* Delete / Danger */}
            <div>
              <p className="text-xs text-charcoal/40 uppercase tracking-wider mb-4">Danger / Удалить</p>
              <div className="flex flex-wrap items-center gap-4">
                <button className="p-1.5 rounded-lg text-charcoal/25 hover:text-red-400 hover:bg-red-50 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <button className="text-sm text-red-400 hover:text-red-500 transition-colors">
                  Удалить рецепт
                </button>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Inputs ─────────────────────────────────────────────────────────── */}
        <Section id="inputs" title="Инпуты">
          <div className="space-y-8 max-w-md">
            {/* Text input */}
            <div>
              <p className="text-xs text-charcoal/40 uppercase tracking-wider mb-3">Text Input</p>
              <label className="block text-xs text-charcoal/40 uppercase tracking-wider mb-2">Название *</label>
              <input
                type="text"
                placeholder="Тарт с инжиром и рикоттой"
                className="w-full bg-sand rounded-xl px-4 py-3 text-sm text-charcoal placeholder:text-charcoal/25 outline-none focus:ring-2 focus:ring-peach/30 transition"
              />
            </div>

            {/* Input with hint */}
            <div>
              <label className="block text-xs text-charcoal/40 uppercase tracking-wider mb-2">Slug (URL) *</label>
              <input
                type="text"
                defaultValue="tart-s-inzhirom"
                className="w-full bg-sand rounded-xl px-4 py-3 text-sm text-charcoal placeholder:text-charcoal/25 outline-none focus:ring-2 focus:ring-peach/30 transition"
              />
              <p className="mt-1 text-xs text-charcoal/30">/recipes/tart-s-inzhirom</p>
            </div>

            {/* Textarea */}
            <div>
              <p className="text-xs text-charcoal/40 uppercase tracking-wider mb-3">Textarea</p>
              <label className="block text-xs text-charcoal/40 uppercase tracking-wider mb-2">Описание</label>
              <textarea
                rows={3}
                placeholder="Нежный французский тарт с рикоттой, свежим инжиром и тимьяном"
                className="w-full bg-sand rounded-xl px-4 py-3 text-sm text-charcoal resize-none placeholder:text-charcoal/25 outline-none focus:ring-2 focus:ring-peach/30 transition"
              />
            </div>

            {/* Search input */}
            <div>
              <p className="text-xs text-charcoal/40 uppercase tracking-wider mb-3">Search</p>
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Поиск..."
                  className="bg-sand rounded-full pl-9 pr-4 py-2.5 text-sm text-charcoal placeholder:text-charcoal/35 outline-none focus:ring-2 focus:ring-peach/30 transition w-56"
                />
              </div>
            </div>
          </div>
        </Section>

        {/* ── Toggles ────────────────────────────────────────────────────────── */}
        <Section id="toggles" title="Тогл">
          <div className="space-y-6">
            <div>
              <p className="text-xs text-charcoal/40 uppercase tracking-wider mb-4">Состояния</p>
              <div className="flex flex-col gap-4">
                <ToggleDemo label="Включён (sage)" defaultOn={true} color="bg-sage" />
                <ToggleDemo label="Выключен (sage)" defaultOn={false} color="bg-sage" />
                <ToggleDemo label="Включён (peach)" defaultOn={true} color="bg-peach" />
                <ToggleDemo label="Выключен (peach)" defaultOn={false} color="bg-peach" />
              </div>
            </div>

            <div>
              <p className="text-xs text-charcoal/40 uppercase tracking-wider mb-4">В контексте формы</p>
              <div className="bg-sand/40 rounded-2xl p-6 flex flex-col gap-4 max-w-sm">
                <ToggleDemo label="Опубликован" defaultOn={true} color="bg-sage" />
                <ToggleDemo label="Самое любимое блюдо" defaultOn={false} color="bg-peach" />
              </div>
            </div>
          </div>
        </Section>

        {/* ── Recipe Card ────────────────────────────────────────────────────── */}
        <Section id="recipe-card" title="Карточка рецепта">
          <div className="space-y-8">
            <div>
              <p className="text-xs text-charcoal/40 uppercase tracking-wider mb-4">Разные пропорции</p>
              <div className="flex flex-wrap gap-4 items-start">
                <div className="w-48">
                  <RecipeCard recipe={DUMMY_RECIPE} aspectClass="aspect-[3/4]" />
                </div>
                <div className="w-64">
                  <RecipeCard recipe={DUMMY_RECIPE_2} aspectClass="aspect-[4/3]" />
                </div>
                <div className="w-48">
                  <RecipeCard recipe={DUMMY_RECIPE} aspectClass="aspect-[1/1]" />
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs text-charcoal/40 uppercase tracking-wider mb-4">Фиксированная высота (fillHeight)</p>
              <div className="flex gap-4 h-[260px]">
                <div className="w-48 h-full">
                  <RecipeCard recipe={DUMMY_RECIPE} fillHeight />
                </div>
                <div className="w-64 h-full">
                  <RecipeCard recipe={DUMMY_RECIPE_2} fillHeight />
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Favorite Button ────────────────────────────────────────────────── */}
        <Section id="favorite-button" title="Кнопка избранного">
          <div className="space-y-6">
            <p className="text-xs text-charcoal/40 uppercase tracking-wider mb-2">
              Состояния (нажмите для переключения)
            </p>
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 bg-sand rounded-xl flex items-center justify-center">
                  <FavoriteButton slug="demo-fav-1" />
                </div>
                <span className="text-xs text-charcoal/40">Default</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 bg-charcoal/80 rounded-xl flex items-center justify-center">
                  <FavoriteButton slug="demo-fav-2" />
                </div>
                <span className="text-xs text-charcoal/40">На тёмном</span>
              </div>
            </div>
          </div>
        </Section>

        {/* ── Filter Dropdown ────────────────────────────────────────────────── */}
        <Section id="filter-dropdown" title="Фильтр">
          <div className="space-y-4">
            <p className="text-xs text-charcoal/40 uppercase tracking-wider mb-2">
              Кнопки фильтра (стили)
            </p>
            <div className="flex items-center gap-2 bg-cream border border-sand rounded-2xl p-3">
              <div className="relative">
                <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-charcoal/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Поиск..."
                  className="bg-sand rounded-full pl-9 pr-4 py-2.5 text-sm text-charcoal placeholder:text-charcoal/35 outline-none w-44"
                />
              </div>
              <div className="w-px h-5 bg-charcoal/10 mx-1" />
              {["Тип блюда", "Кухня", "Сезон"].map((label) => (
                <button
                  key={label}
                  className="flex items-center gap-1.5 px-3 py-2.5 rounded-full text-sm whitespace-nowrap text-charcoal/50 hover:text-charcoal hover:bg-sand transition-colors"
                >
                  {label}
                  <svg className="w-3 h-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              ))}
              <div className="w-px h-5 bg-charcoal/10 mx-1" />
              <button className="flex items-center gap-1.5 px-3 py-2.5 text-sm text-charcoal/40 hover:text-peach transition-colors whitespace-nowrap">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
                Сбросить (2)
              </button>
            </div>
          </div>
        </Section>

        {/* ── Shadows & Radius ───────────────────────────────────────────────── */}
        <Section id="shadows" title="Тени и скругления">
          <div className="space-y-8">
            <div>
              <p className="text-xs text-charcoal/40 uppercase tracking-wider mb-4">Box Shadow</p>
              <div className="flex flex-wrap gap-8">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-32 h-32 bg-white rounded-2xl shadow-card" />
                  <span className="text-xs text-charcoal/40">shadow-card</span>
                  <span className="text-[10px] text-charcoal/30 font-mono">0 8px 32px rgba(28,25,23,0.08)</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="w-32 h-32 bg-white rounded-2xl shadow-sm" />
                  <span className="text-xs text-charcoal/40">shadow-sm</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                  <div className="w-32 h-32 bg-white rounded-2xl" style={{ boxShadow: "0 16px 32px rgba(28,25,23,0.12)" }} />
                  <span className="text-xs text-charcoal/40">card hover</span>
                  <span className="text-[10px] text-charcoal/30 font-mono">0 16px 32px rgba(28,25,23,0.12)</span>
                </div>
              </div>
            </div>

            <div>
              <p className="text-xs text-charcoal/40 uppercase tracking-wider mb-4">Border Radius</p>
              <div className="flex flex-wrap gap-8">
                {[
                  { label: "rounded-xl", value: "12px", cls: "rounded-xl" },
                  { label: "rounded-2xl", value: "16px", cls: "rounded-2xl" },
                  { label: "rounded-card", value: "24px", cls: "rounded-card" },
                  { label: "rounded-full", value: "9999px", cls: "rounded-full" },
                ].map((item) => (
                  <div key={item.label} className="flex flex-col items-center gap-3">
                    <div className={cn("w-24 h-24 bg-sand border border-charcoal/10", item.cls)} />
                    <span className="text-xs text-charcoal/40">{item.label}</span>
                    <span className="text-[10px] text-charcoal/30 font-mono">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Section>

        {/* ── Animations ─────────────────────────────────────────────────────── */}
        <Section id="animations" title="Анимации">
          <div className="space-y-10">
            {/* Card hover */}
            <div>
              <p className="text-xs text-charcoal/40 uppercase tracking-wider mb-4">
                Recipe Card Hover Lift (наведите)
              </p>
              <div className="w-48">
                <RecipeCard recipe={DUMMY_RECIPE} aspectClass="aspect-[4/3]" />
              </div>
            </div>

            {/* FadeInUp */}
            <div>
              <p className="text-xs text-charcoal/40 uppercase tracking-wider mb-4">
                FadeInUp (проскролльте)
              </p>
              <FadeInUp>
                <div className="bg-sand rounded-2xl p-8 max-w-sm">
                  <p className="font-handwritten text-2xl text-charcoal/70">
                    Этот блок появится с анимацией при скролле
                  </p>
                </div>
              </FadeInUp>
            </div>

            {/* Stagger */}
            <div>
              <p className="text-xs text-charcoal/40 uppercase tracking-wider mb-4">
                FadeInUp Stagger
              </p>
              <FadeInUp stagger>
                <div className="flex gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="w-24 h-24 bg-sand rounded-2xl flex items-center justify-center">
                      <span className="font-handwritten text-xl text-charcoal/30">{i}</span>
                    </div>
                  ))}
                </div>
              </FadeInUp>
            </div>

            {/* Shimmer */}
            <div>
              <p className="text-xs text-charcoal/40 uppercase tracking-wider mb-4">
                Shimmer Text
              </p>
              <span className="font-serif text-5xl">
                <em className="not-italic shimmer-text">люблю</em>
              </span>
            </div>
          </div>
        </Section>

        {/* Spacer */}
        <div className="h-20" />
      </div>
    </FavoritesProvider>
  );
}

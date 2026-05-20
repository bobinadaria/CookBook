import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── Editorial magazine дизайн-система (2026) ────────────────────────
        //     Через CSS-переменные (globals.css :root и .dark) — светлая и
        //     тёмная темы из одного места.
        paper:        "hsl(var(--paper)    / <alpha-value>)",  // основной фон
        crust:        "hsl(var(--crust)    / <alpha-value>)",  // карточки, асайды
        burg:         "hsl(var(--burg)     / <alpha-value>)",  // primary, заголовки
        "burg-dk":    "hsl(var(--burg-dk)  / <alpha-value>)",  // hover на burg
        ochre:        "hsl(var(--ochre)    / <alpha-value>)",  // accent
        "ochre-dk":   "hsl(var(--ochre-dk) / <alpha-value>)",  // eyebrow, hover
        olive:        "hsl(var(--olive)    / <alpha-value>)",  // позитивные ●
        ink:          "hsl(var(--ink)      / <alpha-value>)",  // основной текст
        soft:         "var(--soft)",          // приглушённый текст, meta
        muted:        "var(--muted)",         // плейсхолдеры
        rule:         "var(--rule)",          // линии-правила
        "soft-invert": "var(--soft-invert)",  // текст на burg-поверхности
        "rule-invert": "var(--rule-invert)",  // линии на burg-поверхности
      },
      borderRadius: {
        // Magazine = прямые углы. DEFAULT (bare `rounded`) → 0.
        // xl/2xl/full остаются из Tailwind по умолчанию (FavoriteButton — круг).
        none: "0",
        sm: "2px",
        DEFAULT: "0",
      },
      fontFamily: {
        display: ["var(--font-display)", "Bodoni Moda", "Playfair Display", "serif"],
        body:    ["var(--font-body)",    "Work Sans", "system-ui", "sans-serif"],
        reader:  ["var(--font-reader)",  "Newsreader", "Georgia", "serif"],
      },
      letterSpacing: {
        eyebrow: "0.15em",
        tight: "-0.02em",
        display: "-0.04em",
      },
    },
  },
  plugins: [],
};
export default config;

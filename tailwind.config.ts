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
        // CSS-variable tokens — all opacity modifiers (e.g. text-charcoal/70) keep working
        cream:        "hsl(var(--cream)      / <alpha-value>)",
        sand:         "hsl(var(--sand)       / <alpha-value>)",
        charcoal:     "hsl(var(--charcoal)   / <alpha-value>)",
        peach:        "hsl(var(--peach)      / <alpha-value>)",
        "peach-dark": "hsl(var(--peach-dark) / <alpha-value>)",
        sage:         "hsl(var(--sage)       / <alpha-value>)",
        "sage-dark":  "hsl(var(--sage-dark)  / <alpha-value>)",
      },
      borderRadius: {
        card: "24px",
      },
      boxShadow: {
        card: "0 8px 32px rgba(28,25,23,0.08)",
      },
      fontFamily: {
        serif: ["var(--font-cormorant)", "Georgia", "serif"],
        "serif-display": ["var(--font-dm-serif)", "Georgia", "serif"],
        handwritten: ["var(--font-satisfy)", "cursive"],
        sans: ["var(--font-plus-jakarta)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;

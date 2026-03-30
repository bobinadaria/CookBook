import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: "#FDFAF5",
        sand: "#F2E8DC",
        charcoal: "#1C1917",
        peach: "#E8956D",
        "peach-dark": "#D4956A",
        sage: "#8BAF8C",
        "sage-dark": "#6B9470",
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

import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ru", "en", "cs"],
  defaultLocale: "ru",
  localePrefix: "never",
  localeCookie: { name: "NEXT_LOCALE", sameSite: "lax" },
  localeDetection: true,
});

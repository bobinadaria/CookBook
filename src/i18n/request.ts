import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // 1. Try middleware-provided locale
  let locale = await requestLocale;

  // 2. Fallback: read NEXT_LOCALE cookie directly
  if (!locale || !routing.locales.includes(locale as "ru" | "en")) {
    const cookieStore = cookies();
    const cookieLocale = cookieStore.get("NEXT_LOCALE")?.value;
    if (cookieLocale && routing.locales.includes(cookieLocale as "ru" | "en")) {
      locale = cookieLocale;
    } else {
      locale = routing.defaultLocale;
    }
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});

"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const LOCALES = [
  { code: "ru", label: "RU" },
  { code: "en", label: "EN" },
] as const;

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();

  const switchLocale = (newLocale: string) => {
    if (newLocale === locale) return;
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=${365 * 24 * 60 * 60};samesite=lax`;
    router.refresh();
  };

  return (
    <div className="flex items-center gap-0.5 bg-crust/60 rounded-none p-0.5">
      {LOCALES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => switchLocale(code)}
          className={cn(
            "px-2 py-1 rounded-none text-[11px] font-medium transition-all duration-200",
            locale === code
              ? "bg-burg text-paper shadow-sm"
              : "text-soft hover:text-burg"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

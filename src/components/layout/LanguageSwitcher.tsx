"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const LOCALES = [
  { code: "ru", label: "RU" },
  { code: "en", label: "EN" },
  { code: "cs", label: "CS" },
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
    <div className="flex items-center gap-0.5 bg-sand/60 rounded-full p-0.5">
      {LOCALES.map(({ code, label }) => (
        <button
          key={code}
          onClick={() => switchLocale(code)}
          className={cn(
            "px-2 py-1 rounded-full text-[11px] font-medium transition-all duration-200",
            locale === code
              ? "bg-charcoal text-cream shadow-sm"
              : "text-charcoal/40 hover:text-charcoal"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

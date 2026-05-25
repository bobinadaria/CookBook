"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { localizedField } from "@/lib/localized-content";
import { cn } from "@/lib/utils";
import type { LocaleCode } from "@/types";

/** 1-based позиция → римская цифра (как в карточках каталога). */
function toRoman(n: number): string {
  const map: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"],
    [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"],
    [5, "V"], [4, "IV"], [1, "I"],
  ];
  let out = "";
  let num = n;
  for (const [v, s] of map) {
    while (num >= v) {
      out += s;
      num -= v;
    }
  }
  return out || "—";
}

/**
 * Одна карточка «Моей книги» — либо собственный рецепт пользователя, либо
 * сохранённый (бывшее «Избранное») рецепт из публичного каталога.
 * `href` уже посчитан на сервере: свой → /dashboard/recipes/[id],
 * сохранённый → /recipes/[slug].
 */
export interface BookItem {
  id: string;
  kind: "own" | "saved";
  href: string;
  title: string;
  title_en: string | null;
  cover_image: string | null;
}

type Tab = "all" | "mine" | "saved";

export default function MyBookView({ items }: { items: BookItem[] }) {
  const t = useTranslations("myRecipes");
  const locale = useLocale() as LocaleCode;
  const [tab, setTab] = useState<Tab>("all");

  const mineCount = items.filter((i) => i.kind === "own").length;
  const savedCount = items.filter((i) => i.kind === "saved").length;

  const visible = items.filter((i) =>
    tab === "all" ? true : tab === "mine" ? i.kind === "own" : i.kind === "saved",
  );

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "all", label: t("tabAll"), count: items.length },
    { key: "mine", label: t("tabMine"), count: mineCount },
    { key: "saved", label: t("tabSaved"), count: savedCount },
  ];

  return (
    <>
      {/* Вкладки-фильтры */}
      <div className="mb-8 flex flex-wrap gap-2">
        {tabs.map((tb) => {
          const active = tab === tb.key;
          return (
            <button
              key={tb.key}
              type="button"
              onClick={() => setTab(tb.key)}
              className={cn(
                "rounded-none border px-4 py-2 font-body text-[12px] font-semibold uppercase tracking-[0.12em] transition-colors",
                active
                  ? "border-burg bg-burg text-paper"
                  : "border-rule bg-transparent text-soft hover:border-burg hover:text-burg",
              )}
            >
              {tb.label} <span className="opacity-60">{tb.count}</span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="border-t border-rule py-24 text-center">
          <p className="mb-2 font-display text-[28px] italic text-burg/40">
            {tab === "saved" ? t("savedEmpty") : t("empty")}
          </p>
          <p className="font-body text-sm text-soft">
            {tab === "saved" ? t("savedEmptyHint") : t("emptyHint")}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-x-9 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item, i) => {
            const title = localizedField(item, "title", locale) ?? item.title;
            return (
              <Link
                key={`${item.kind}-${item.id}`}
                href={item.href}
                className="group block transition-transform duration-300 hover:-translate-y-0.5"
              >
                {/* Изображение — квадрат (фото в рецептах квадратные) */}
                <div className="relative aspect-square w-full overflow-hidden bg-crust">
                  {item.cover_image ? (
                    <Image
                      src={item.cover_image}
                      alt={title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-crust">
                      <span className="font-display text-3xl italic text-burg/30">The Slow Table</span>
                    </div>
                  )}
                  <div className="absolute left-3 top-3 bg-ochre px-2.5 py-1.5 font-body text-[10px] font-bold uppercase tracking-[0.16em] text-seal transition-colors group-hover:bg-ochre-dk">
                    {item.kind === "own" ? t("labelMine") : t("labelSaved")}
                  </div>
                </div>

                {/* Цифра + заголовок */}
                <div className="mt-4 flex items-baseline gap-4">
                  <span className="font-display text-[44px] font-normal italic leading-[0.9] text-ochre sm:text-[52px]">
                    {toRoman(i + 1)}
                  </span>
                  <div className="flex-1">
                    <h3 className="font-display text-[20px] font-normal leading-[1.15] text-ink transition-colors group-hover:text-burg sm:text-[24px]">
                      {title}
                    </h3>
                  </div>
                </div>

                {/* Нижняя строка */}
                <div className="mt-3.5 flex items-center justify-between border-t border-rule pt-3 font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-soft">
                  <span>&nbsp;</span>
                  <span className="transition-colors group-hover:text-burg">{t("open")} &rarr;</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}

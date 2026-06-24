"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { localizedField } from "@/lib/localized-content";
import { noBreakHyphens } from "@/lib/text";
import type { Category, LocaleCode, RecipeCardData } from "@/types";
import FavoriteButton from "./FavoriteButton";
import { useFavorites } from "@/context/FavoritesContext";

/** Convert a 1-based position to a roman numeral (magazine chapter mark). */
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

interface RecipeCardProps {
  recipe: RecipeCardData;
  /** Aspect ratio class for the image. Default square (фото в рецептах квадратные). */
  aspectClass?: string;
  /** Backward-compat: fill parent height instead of using the aspect class. */
  fillHeight?: boolean;
  /** Override locale (when rendered from a server component that knows the locale). */
  locale?: LocaleCode;
  className?: string;
  /** 1-based position → roman chapter numeral + "P. NNN" plate. Omit to hide both. */
  index?: number;
  /** Show the footer meta row (cook time · Читать →). Default true. */
  showMeta?: boolean;
  /**
   * Плотный режим для мобильного 2-колоночного каталога: на узких экранах
   * прячем крупную римскую цифру и «Читать →», уменьшаем заголовок и режем его
   * до 2 строк. На lg (десктоп, 3 колонки) карточка выглядит как раньше.
   */
  compact?: boolean;
}

export default function RecipeCard({
  recipe,
  aspectClass = "aspect-square",
  fillHeight = false,
  locale: localeProp,
  className,
  index,
  showMeta = true,
  compact = false,
}: RecipeCardProps) {
  const hookLocale = useLocale() as LocaleCode;
  const locale = localeProp ?? hookLocale;
  const t = useTranslations("recipe");
  const { favorites } = useFavorites();
  const isFavorited = favorites.has(recipe.slug);

  const title = localizedField(recipe, "title", locale) ?? recipe.title;

  // Prefer a meal-type category for the eyebrow; fall back to the first one.
  const cats = (recipe.categories ?? []) as Category[];
  const primaryCat: Category | undefined =
    cats.find((c) => c.type === "meal_type") ?? cats[0];
  const categoryLabel = primaryCat
    ? localizedField(primaryCat, "name", locale) ?? primaryCat.name
    : null;

  // У напитков показываем метку «Напиток» вместо категории.
  const isDrink = recipe.recipe_type === "drink";
  const eyebrowLabel = isDrink ? t("drinkLabel") : categoryLabel;

  const hasNumber = typeof index === "number";
  const roman = hasNumber ? toRoman(index as number) : null;
  const pageNo = hasNumber ? String((index as number) * 6 + 2).padStart(3, "0") : null;

  // В compact мобильное фото занимает ~половину ширины (2 колонки), а не всю.
  const imgSizes = compact
    ? "(max-width: 1024px) 50vw, 33vw"
    : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw";

  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      className={cn(
        "recipe-card-hover group block transition-transform duration-300 hover:-translate-y-0.5",
        fillHeight && "flex h-full flex-col",
        className,
      )}
    >
      {/* ── Image ── */}
      <div
        className={cn(
          "relative w-full overflow-hidden bg-crust",
          fillHeight ? "min-h-0 flex-1" : aspectClass,
        )}
      >
        {recipe.cover_image ? (
          <Image
            src={recipe.cover_image}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
            sizes={imgSizes}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-crust">
            <span className="font-display text-3xl italic text-burg/30">The Slow Table</span>
          </div>
        )}

        {pageNo && (
          <div className="absolute left-3 top-3 bg-ochre px-2.5 py-1.5 font-body text-[10px] font-bold uppercase tracking-[0.16em] text-seal transition-colors group-hover:bg-ochre-dk">
            P. {pageNo}
          </div>
        )}

        <div className={cn("recipe-card-fav absolute right-3 top-3", isFavorited && "is-favorited")}>
          <FavoriteButton slug={recipe.slug} />
        </div>
      </div>

      {/* ── Title block ── */}
      <div
        className={cn(
          "flex items-baseline gap-4",
          compact ? "mt-3 lg:mt-4" : "mt-4",
          fillHeight && "flex-shrink-0",
        )}
      >
        {roman && (
          <span
            className={cn(
              "font-display font-normal italic leading-[0.9] text-ochre",
              compact ? "hidden lg:block lg:text-[52px]" : "text-[44px] sm:text-[52px]",
            )}
          >
            {roman}
          </span>
        )}
        <div className="min-w-0 flex-1">
          {eyebrowLabel && (
            <div
              className={cn(
                "font-body font-semibold uppercase tracking-[0.2em] text-ochre-dk",
                compact ? "mb-1 text-[10px] lg:mb-1.5 lg:text-[11px]" : "mb-1.5 text-[11px]",
              )}
            >
              {eyebrowLabel}
            </div>
          )}
          {/* min-h-[2lh] резервирует высоту ровно на 2 строки заголовка
              независимо от его реальной длины (короткие названия вроде «Папин
              плов в казане» иначе занимали бы 1 строку, и низ карточки —
              разделитель + время + «Читать →» — скакал бы относительно соседних
              карточек в том же ряду). Юнит lh = высота строки самого элемента,
              поэтому работает сразу на всех брейкпоинтах без отдельных значений
              на каждый размер шрифта. */}
          <h3
            className={cn(
              "min-h-[2lh] font-display font-normal leading-[1.15] text-ink transition-colors group-hover:text-burg",
              compact ? "line-clamp-2 text-[15px] lg:text-[24px]" : "text-[20px] sm:text-[24px]",
            )}
          >
            {noBreakHyphens(title)}
          </h3>
        </div>
      </div>

      {/* ── Footer meta ── */}
      {showMeta && (
        <div
          className={cn(
            "flex items-center justify-between border-t border-rule font-body text-[11px] font-semibold uppercase tracking-[0.14em] text-soft",
            compact ? "mt-3 pt-2.5" : "mt-3.5 pt-3",
          )}
        >
          <span>{recipe.cook_time ? `${recipe.cook_time} ${t("min")}` : " "}</span>
          <span className={cn("transition-colors group-hover:text-burg", compact && "hidden lg:inline")}>
            {t("readMore")}
          </span>
        </div>
      )}
    </Link>
  );
}

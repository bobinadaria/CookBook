"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { localizedField } from "@/lib/localized-content";
import type { LocaleCode, RecipeCardData } from "@/types";
import FavoriteButton from "./FavoriteButton";
import { useFavorites } from "@/context/FavoritesContext";

interface RecipeCardProps {
  recipe: RecipeCardData;
  aspectClass?: string;
  fillHeight?: boolean;
  /** Override locale (e.g. when rendering in a server component that already knows the locale). */
  locale?: LocaleCode;
  className?: string;
}

export default function RecipeCard({
  recipe,
  aspectClass = "aspect-[4/3]",
  fillHeight = false,
  locale: localeProp,
  className,
}: RecipeCardProps) {
  const hookLocale = useLocale() as LocaleCode;
  const locale = localeProp ?? hookLocale;
  const { favorites } = useFavorites();
  const isFavorited = favorites.has(recipe.slug);
  const title = localizedField(recipe as Record<string, unknown>, "title", locale) ?? recipe.title;

  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      className={cn("group block recipe-card-hover", fillHeight && "flex flex-col h-full", className)}
    >
      <div
        className={cn(
          "recipe-card-image relative overflow-hidden rounded-2xl w-full",
          fillHeight ? "flex-1 min-h-0" : aspectClass
        )}
      >
        {recipe.cover_image ? (
          <Image
            src={recipe.cover_image}
            alt={title}
            fill
            className="object-cover group-hover:scale-[1.04] transition-transform duration-500 ease-out"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full bg-sand flex items-center justify-center">
            <span className="font-handwritten text-3xl text-charcoal/20">CookBook</span>
          </div>
        )}

        <div
          className={cn(
            "recipe-card-fav absolute top-3 left-3",
            isFavorited && "is-favorited"
          )}
        >
          <FavoriteButton slug={recipe.slug} />
        </div>

        <div className="recipe-card-arrow absolute bottom-3 right-3 pointer-events-none">
          <div className="w-8 h-8 bg-cream/95 rounded-full flex items-center justify-center shadow-sm">
            <svg
              className="w-3.5 h-3.5 text-charcoal"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>

      <div className={cn("recipe-card-title pt-3 pb-1", fillHeight && "flex-shrink-0")}>
        <h3 className="text-sm text-charcoal leading-snug group-hover:text-peach transition-colors duration-200">
          {title}
        </h3>
      </div>
    </Link>
  );
}

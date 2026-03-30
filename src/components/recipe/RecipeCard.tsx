"use client";

import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";
import { cn } from "@/lib/utils";
import { type Locale } from "@/lib/localized-content";
import FavoriteButton from "./FavoriteButton";
import { useFavorites } from "@/context/FavoritesContext";

interface RecipeCardProps {
  recipe: {
    id: string;
    title: string;
    slug: string;
    cover_image?: string | null;
    title_en?: string | null;
    title_cs?: string | null;
  };
  aspectClass?: string;
  fillHeight?: boolean;
  locale?: string;
  className?: string;
}

function getLocalizedTitle(recipe: RecipeCardProps["recipe"], locale: Locale): string {
  if (locale === "en" && recipe.title_en) return recipe.title_en;
  if (locale === "cs" && recipe.title_cs) return recipe.title_cs;
  return recipe.title;
}

export default function RecipeCard({
  recipe,
  aspectClass = "aspect-[4/3]",
  fillHeight = false,
  locale: localeProp,
  className,
}: RecipeCardProps) {
  const hookLocale = useLocale();
  const locale = (localeProp ?? hookLocale) as Locale;
  const { favorites } = useFavorites();
  const isFavorited = favorites.has(recipe.slug);
  const title = getLocalizedTitle(recipe, locale);

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
            src={recipe.cover_image as string}
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

        <div className={cn(
          "absolute top-3 left-3 transition-opacity duration-200",
          isFavorited ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}>
          <FavoriteButton slug={recipe.slug} />
        </div>

        <div className="absolute bottom-3 right-3 opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-out">
          <div className="w-8 h-8 bg-cream/95 rounded-full flex items-center justify-center shadow-sm">
            <svg className="w-3.5 h-3.5 text-charcoal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden>
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

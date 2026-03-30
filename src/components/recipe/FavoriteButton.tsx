"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useFavorites } from "@/context/FavoritesContext";

interface FavoriteButtonProps {
  slug: string;
  className?: string;
}

export default function FavoriteButton({ slug, className }: FavoriteButtonProps) {
  const t = useTranslations("common");
  const { user, favorites, toggle } = useFavorites();
  const router = useRouter();
  const isFavorited = favorites.has(slug);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();   // don't follow the parent <Link>
    e.stopPropagation();
    if (!user) {
      router.push("/login");
      return;
    }
    toggle(slug);
  };

  return (
    <button
      onClick={handleClick}
      aria-label={isFavorited ? t("removeFromFavorites") : t("addToFavorites")}
      className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center",
        "bg-cream/90 backdrop-blur-sm shadow-sm",
        "transition-all duration-200",
        isFavorited
          ? "text-peach scale-110"
          : "text-charcoal/40 hover:text-peach hover:scale-110",
        className
      )}
    >
      <svg
        className="w-3.5 h-3.5"
        viewBox="0 0 24 24"
        fill={isFavorited ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}

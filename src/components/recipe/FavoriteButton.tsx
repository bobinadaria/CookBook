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
    e.preventDefault();  // don't follow the parent <Link>
    e.stopPropagation();
    if (!user) {
      router.push("/login");
      return;
    }
    toggle(slug);
  };

  return (
    /*
     * Touch target: visually 32px (w-8 h-8) but the actual tappable area is
     * expanded to 44×44px via padding — meeting Apple HIG & Material Design minimums.
     * The negative margin compensates so layout doesn't shift.
     * On hover-capable devices (desktop) the visual size is unchanged.
     */
    <button
      onClick={handleClick}
      aria-label={isFavorited ? t("removeFromFavorites") : t("addToFavorites")}
      className={cn(
        // Visual size
        "w-8 h-8 rounded-full flex items-center justify-center",
        "bg-paper/90 backdrop-blur-sm shadow-sm",
        "transition-all duration-200",
        // Expand touch area on touch devices without affecting layout
        "relative after:absolute after:inset-0 after:content-['']",
        "after:-m-[6px] after:min-w-[44px] after:min-h-[44px]",
        isFavorited
          ? "text-ochre-dk scale-110"
          : "text-soft hover:text-ochre-dk hover:scale-110",
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
        aria-hidden
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    </button>
  );
}

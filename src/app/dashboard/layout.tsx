import Header from "@/components/layout/Header";
import { FavoritesProvider } from "@/context/FavoritesContext";
import DashboardNav from "./DashboardNav";

/**
 * Общий каркас личного кабинета: шапка сайта + под-навигация (Кабинет /
 * Избранное / Заметки) + FavoritesProvider (нужен карточкам рецептов внутри).
 * Доступ к /dashboard уже защищён middleware (редирект на /login без сессии).
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FavoritesProvider>
      <div className="pt-16 min-h-dvh">
        <Header />
        <DashboardNav />
        {children}
      </div>
    </FavoritesProvider>
  );
}

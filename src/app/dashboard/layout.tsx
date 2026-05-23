import Header from "@/components/layout/Header";
import DashboardTabs from "@/components/dashboard/DashboardTabs";
import { FavoritesProvider } from "@/context/FavoritesContext";

/**
 * Каркас личного кабинета: шапка сайта + FavoritesProvider (нужен карточкам
 * рецептов и кнопке-сердечку внутри). Внутренняя навигация «Моей книги»
 * (вкладки «Рецепты» / «Аккаунт») живёт в DashboardTabs — в верхнем меню
 * остаётся одна ссылка «Моя книга».
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
        <DashboardTabs />
        {children}
      </div>
    </FavoritesProvider>
  );
}

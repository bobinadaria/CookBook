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
      {/* Без pt-16: шапка должна стоять вплотную к верху, как на публичных
          страницах (раньше лишний отступ делал хедер в кабинете выше). */}
      <div className="min-h-dvh bg-paper">
        <Header />
        <DashboardTabs />
        {children}
      </div>
    </FavoritesProvider>
  );
}

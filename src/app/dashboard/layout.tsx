import Header from "@/components/layout/Header";
import { FavoritesProvider } from "@/context/FavoritesContext";

/**
 * Каркас личного кабинета: шапка сайта + FavoritesProvider.
 * Вся навигация кабинета живёт внутри одной страницы /dashboard —
 * вкладок и отдельных разделов больше нет.
 * Доступ к /dashboard защищён middleware (редирект на /login без сессии).
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <FavoritesProvider>
      <div className="min-h-dvh bg-paper">
        <Header />
        {children}
      </div>
    </FavoritesProvider>
  );
}

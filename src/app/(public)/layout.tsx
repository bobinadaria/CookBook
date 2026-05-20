import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import PageTransition from "@/components/animations/PageTransition";
import { FavoritesProvider } from "@/context/FavoritesContext";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <FavoritesProvider>
      <div className="flex min-h-dvh flex-col bg-paper">
        <Header />
        <main className="flex-1">
          <PageTransition>{children}</PageTransition>
        </main>
        <Footer />
      </div>
    </FavoritesProvider>
  );
}

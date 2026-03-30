import Header from "@/components/layout/Header";
import PageTransition from "@/components/animations/PageTransition";
import { FavoritesProvider } from "@/context/FavoritesContext";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <FavoritesProvider>
      <Header />
      <div className="pt-16">
        <PageTransition>{children}</PageTransition>
      </div>
    </FavoritesProvider>
  );
}

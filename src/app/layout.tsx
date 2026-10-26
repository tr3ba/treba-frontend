import type { Metadata, Viewport } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import MobileTabBar from "../components/layout/MobileTabBar";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { CategoriesProvider } from "../context/CategoriesContext";
import { ComparisonProvider } from "../context/ComparisonContext";
import { WishlistProvider } from "../context/WishlistContext";
import { getCategories } from "../lib/api/categories";
import type { Category } from "../types/category";

const montserrat = Montserrat({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: "Treba",
  description: "TREBA — український маркетплейс",
};

// viewportFit: "cover" — чтобы env(safe-area-inset-bottom) работал на iPhone
// и нижняя панель не залезала под системную полоску «домой». На ПК ни на что не влияет.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Все страницы рендерятся при запросе, а не во время next build:
// данные живые (цены, остатки), а API на этапе сборки недоступен.
// Кэширование (revalidate) — отдельным шагом, этап 7.
export const dynamic = "force-dynamic";

// Категории для меню каталога. Если бэк недоступен — сайт работает дальше с пустым меню.
async function loadCategories(): Promise<Category[]> {
  try {
    return await getCategories();
  } catch (error) {
    console.error("Не вдалося завантажити категорії:", error);
    return [];
  }
}

export default async function RootLayout({
  children,
  modal,
}: Readonly<{
  children: React.ReactNode;
  modal: React.ReactNode;
}>) {
  const categories = await loadCategories();

  return (
    <html lang="uk">
      <body className={montserrat.variable}>
        <CategoriesProvider categories={categories}>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <ComparisonProvider>
                  {children}
                  {modal}
                  {/* нижняя панель — только на телефоне (≤768px) */}
                  <MobileTabBar />
                </ComparisonProvider>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </CategoriesProvider>
      </body>
    </html>
  );
}
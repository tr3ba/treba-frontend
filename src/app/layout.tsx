import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import { CartProvider } from "../context/CartContext";
import { CategoriesProvider } from "../context/CategoriesContext";
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
              {children}
              {modal}
            </CartProvider>
          </AuthProvider>
        </CategoriesProvider>
      </body>
    </html>
  );
}
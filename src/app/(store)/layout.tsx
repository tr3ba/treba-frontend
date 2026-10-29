
import MobileTabBar from "../../components/layout/MobileTabBar";
import { AuthProvider } from "../../context/AuthContext";
import { CartProvider } from "../../context/CartContext";
import { CategoriesProvider } from "../../context/CategoriesContext";
import { ComparisonProvider } from "../../context/ComparisonContext";
import { WishlistProvider } from "../../context/WishlistContext";
import { getCategories } from "../../lib/api/categories";
import type { Category } from "../../types/category";


async function loadCategories(): Promise<Category[]> {
  try {
    return await getCategories();
  } catch (error) {
    console.error("Не вдалося завантажити категорії:", error);
    return [];
  }
}


export default async function StoreLayout({ children, modal }: { children: React.ReactNode; modal: React.ReactNode }) { const categories = await loadCategories(); return (
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

); }

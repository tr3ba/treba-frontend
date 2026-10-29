import type { Metadata } from "next";
import Header from "../../../../components/layout/Header";
import Footer from "../../../../components/home/Footer";
import ComparisonView from "../../../../components/comparison/ComparisonView";
import { getComparisonProducts } from "../../../../lib/api/products";
import type { ComparisonCardProduct } from "../../../../types/comparison";

export const metadata: Metadata = {
  title: "Порівняння товарів — Treba",
};

type ComparisonPageProps = {
  params: Promise<{ listId: string }>;
};

// Бэк недоступний — сторінка відкриється з повідомленням, що товари недоступні
async function loadProducts(): Promise<ComparisonCardProduct[]> {
  try {
    return await getComparisonProducts();
  } catch (error) {
    console.error("Не вдалося завантажити товари для порівняння:", error);
    return [];
  }
}

export default async function ComparisonPage({ params }: ComparisonPageProps) {
  const { listId } = await params;
  const products = await loadProducts();

  return (
    <>
      <Header />
      <ComparisonView listId={listId} products={products} />
      <Footer />
    </>
  );
}
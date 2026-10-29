import AccountPageShell from "../../../../components/account/AccountPageShell";
import ComparisonListsView from "../../../../components/comparison/ComparisonListsView";
import { getComparisonProducts } from "../../../../lib/api/products";
import type { ComparisonCardProduct } from "../../../../types/comparison";

// Бэк недоступний — сторінка все одно відкриється, превʼю будуть без фото
async function loadProducts(): Promise<ComparisonCardProduct[]> {
  try {
    return await getComparisonProducts();
  } catch (error) {
    console.error("Не вдалося завантажити товари для порівняння:", error);
    return [];
  }
}

export default async function ComparisonsPage() {
  const products = await loadProducts();

  return (
    <AccountPageShell>
      <ComparisonListsView products={products} />
    </AccountPageShell>
  );
}
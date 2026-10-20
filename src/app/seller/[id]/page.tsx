import SellerProducts from "../../../components/seller/SellerProducts";
import { getSellerProducts } from "../../../lib/api/sellers";
import { parseSellerSort } from "../../../lib/sellerLinks";

type SellerProductsPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ category?: string; sort?: string; page?: string }>;
};

// Вкладка «Товари продавця». Фильтры живут в адресе: ?category=…&sort=…&page=…
export default async function SellerProductsPage({ params, searchParams }: SellerProductsPageProps) {
  const { id } = await params;
  const query = await searchParams;

  const category = query.category || undefined;
  const sort = parseSellerSort(query.sort);
  const page = Number(query.page) || 1;

  const result = await getSellerProducts(id, { categoryId: category, sort, page });

  return <SellerProducts sellerId={id} result={result} activeCategory={category} sort={sort} />;
}
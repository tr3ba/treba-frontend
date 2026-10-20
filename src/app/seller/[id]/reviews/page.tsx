import { notFound } from "next/navigation";
import SellerReviews from "../../../../components/seller/SellerReviews";
import { getSellerById, getSellerReviews } from "../../../../lib/api/sellers";
import { parseReviewsSort } from "../../../../lib/sellerLinks";

type SellerReviewsPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sort?: string }>;
};

// Вкладка «Відгуки». Сортировка в адресе: ?sort=newest|highest|lowest
export default async function SellerReviewsPage({ params, searchParams }: SellerReviewsPageProps) {
  const { id } = await params;
  const sort = parseReviewsSort((await searchParams).sort);

  const [seller, reviews] = await Promise.all([getSellerById(id), getSellerReviews(id, sort)]);

  if (!seller) {
    notFound();
  }

  return <SellerReviews sellerId={seller.id} sellerName={seller.name} reviews={reviews} sort={sort} />;
}
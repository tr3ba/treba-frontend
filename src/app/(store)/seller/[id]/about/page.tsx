import { notFound } from "next/navigation";
import SellerAbout from "../../../../../components/seller/SellerAbout";
import { getSellerById } from "../../../../../lib/api/sellers";

type SellerAboutPageProps = {
  params: Promise<{ id: string }>;
};

// Вкладка «Про продавця». Профиль уже загружен в layout — cache() не даст запросить его второй раз
export default async function SellerAboutPage({ params }: SellerAboutPageProps) {
  const { id } = await params;
  const seller = await getSellerById(id);

  if (!seller) {
    notFound();
  }

  return <SellerAbout seller={seller} />;
}
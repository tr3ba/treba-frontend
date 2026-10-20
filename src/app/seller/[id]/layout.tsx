import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/home/Footer";
import SellerHero from "../../../components/seller/SellerHero";
import SellerTabs from "../../../components/seller/SellerTabs";
import { getSellerById, getSellerProducts, getSellerReviewsCount } from "../../../lib/api/sellers";
import styles from "./layout.module.css";

type SellerLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Pick<SellerLayoutProps, "params">): Promise<Metadata> {
  const { id } = await params;
  const seller = await getSellerById(id);
  return {
    title: seller ? `Продавець ${seller.name} — TREBA` : "Продавця не знайдено — TREBA",
  };
}

// Общая часть всех вкладок: шапка продавца и табы. Вкладка — в children.
export default async function SellerLayout({ children, params }: SellerLayoutProps) {
  const { id } = await params;
  const seller = await getSellerById(id);

  if (!seller) {
    notFound();
  }

  // pageSize: 1 — нужны только счётчики, не сами товары
  const [summary, reviewsCount] = await Promise.all([
    getSellerProducts(seller.id, { pageSize: 1 }),
    getSellerReviewsCount(seller.id),
  ]);

  return (
    <>
      <Header />

      <main className={styles.page}>
        <SellerHero
          seller={seller}
          productsCount={summary.totalAll}
          categoriesCount={summary.categories.length}
        />

        <SellerTabs
          sellerId={seller.id}
          productsCount={summary.totalAll}
          reviewsCount={reviewsCount}
        />

        <div className={styles.content}>{children}</div>
      </main>

      <Footer />
    </>
  );
}
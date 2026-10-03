import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";
import Header from "../../components/layout/Header";
import Footer from "../../components/home/Footer";
import CartView from "../../components/cart/CartView";
import ProductCarousel from "../../components/product/ProductCarousel";
import { getRecommendedProducts } from "../../lib/api/products";

export const metadata: Metadata = {
  title: "Кошик — Treba",
};

export default async function CartPage() {
  const recommended = await getRecommendedProducts();

  return (
    <>
      <Header />

      <main className={styles.page}>
        <nav className={styles.breadcrumbs} aria-label="Хлібні крихти">
          <Link href="/" className={styles.crumb}>
            Головна
          </Link>
          <span className={styles.separator}>/</span>
          <span className={styles.crumbCurrent}>Кошик</span>
        </nav>

        <h1 className={styles.title}>Кошик</h1>

        <CartView />

        <ProductCarousel title="Вам також може сподобатися" products={recommended} />
      </main>

      <Footer />
    </>
  );
}
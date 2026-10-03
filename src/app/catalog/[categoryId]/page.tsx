
import { notFound } from "next/navigation";
import styles from "./page.module.css";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/home/Footer";
import ProductBreadcrumbs from "../../../components/product/ProductBreadcrumbs";
import ProductCarousel from "../../../components/product/ProductCarousel";
import CategorySubcategories from "../../../components/catalog/CategorySubcategories";
import CategoryProductsGrid from "../../../components/catalog/CategoryProductsGrid";
import { getCategoryById } from "../../../lib/api/categories";
import { getProductsByCategory, getViewedProducts } from "../../../lib/api/products";

type CategoryPageProps = {
  params: Promise<{ categoryId: string }>;
};

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { categoryId } = await params;
  const category = await getCategoryById(categoryId);

  if (!category) {
    notFound();
  }

  const [products, viewed] = await Promise.all([
    getProductsByCategory(category.id, 12),
    getViewedProducts(""),
  ]);

  return (
    <>
      <Header />

      <main className={styles.page}>
        <ProductBreadcrumbs categoryId={category.id} />

        <div className={styles.heading}>
          <h1 className={styles.title}>{category.label}</h1>
          {category.description && <p className={styles.subtitle}>{category.description}</p>}
        </div>

        {category.subcategories && (
          <CategorySubcategories categoryId={category.id} subcategories={category.subcategories} />
        )}

        <CategoryProductsGrid title="Популярні товари" products={products} />

        <ProductCarousel title="Переглянуті товари" products={viewed} />
      </main>

      <Footer />
    </>
  );
}
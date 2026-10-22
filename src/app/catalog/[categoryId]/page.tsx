import { notFound } from "next/navigation";
import styles from "./page.module.css";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/home/Footer";
import ProductBreadcrumbs from "../../../components/product/ProductBreadcrumbs";
import ViewedProductsCarousel from "../../../components/product/ViewedProductsCarousel";
import CategorySubcategories from "../../../components/catalog/CategorySubcategories";
import CatalogResults from "../../../components/catalog/CatalogResults";
import type { SearchValues } from "../../../lib/catalogQuery";
import { getCategoryById } from "../../../lib/api/categories";

type CategoryPageProps = {
  params: Promise<{ categoryId: string }>;
  searchParams: Promise<SearchValues>;
};

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { categoryId } = await params;
  const category = await getCategoryById(categoryId);

  if (!category) {
    notFound();
  }


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

        <CatalogResults values={await searchParams} path={`/catalog/${category.id}`} categoryId={category.backendId} />

        <ViewedProductsCarousel />
      </main>

      <Footer />
    </>
  );
}

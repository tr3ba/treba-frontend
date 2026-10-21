import Link from "next/link";
import ProductCard from "../home/ProductCard";
import EmptyState from "../account/EmptyState";
import SellerCategoryNav from "./SellerCategoryNav";
import SellerSortSelect from "./SellerSortSelect";
import SellerPagination from "./SellerPagination";
import type { SellerProductsResult, SellerProductsSort } from "../../types/seller";
import { pluralize } from "../../lib/format";
import { sellerProductsHref } from "../../lib/sellerLinks";
import styles from "./SellerProducts.module.css";

type SellerProductsProps = {
  sellerId: string;
  result: SellerProductsResult;
  activeCategory?: string;
  sort: SellerProductsSort;
};

// Вкладка «Товари продавця»: категории + сортировка + сетка + страницы
export default function SellerProducts({ sellerId, result, activeCategory, sort }: SellerProductsProps) {
  const { products, total, totalAll, categories, page, totalPages } = result;

  if (totalAll === 0) {
    return (
      <EmptyState
        icon="/icons/box.svg"
        title="Товарів поки немає"
        subtitle="Продавець ще не додав товари. Зазирніть пізніше."
      />
    );
  }

  const activeLabel = categories.find((category) => category.categoryId === activeCategory)?.label;

  return (
    <div className={styles.layout} id="seller-products">
      <aside className={styles.sidebar}>
        <SellerCategoryNav
          sellerId={sellerId}
          categories={categories}
          totalAll={totalAll}
          activeCategory={activeCategory}
          sort={sort}
        />
      </aside>

      <section className={styles.main} aria-label="Товари продавця">
        <div className={styles.toolbar}>
          <p className={styles.found}>
            {activeLabel && <span className={styles.foundCategory}>{activeLabel}: </span>}
            Знайдено <strong>{total}</strong> {pluralize(total, ["товар", "товари", "товарів"])}
          </p>
          <SellerSortSelect sellerId={sellerId} category={activeCategory} value={sort} />
        </div>

        {products.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyText}>У цій категорії в продавця немає товарів.</p>
            <Link href={sellerProductsHref(sellerId, { sort })} className={styles.emptyLink}>
              Показати всі товари
            </Link>
          </div>
        ) : (
          <div className={styles.grid}>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                backendId={product.backendId}
                variantId={product.variantId}
                title={product.title}
                price={product.price}
                oldPrice={product.oldPrice}
                image={product.image}
                rating={product.rating}
                isPromo={product.isPromo}
                fluid
              />
            ))}
          </div>
        )}

        <SellerPagination
          sellerId={sellerId}
          category={activeCategory}
          sort={sort}
          page={page}
          totalPages={totalPages}
        />
      </section>
    </div>
  );
}
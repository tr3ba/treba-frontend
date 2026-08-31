import { notFound } from "next/navigation";
import styles from "./page.module.css";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/home/Footer";
import ProductGallery from "../../../components/product/ProductGallery";
import SellerInfo from "../../../components/product/SellerInfo";
import ProductPriceBox from "../../../components/product/ProductPriceBox";
import ProductCharacteristics from "../../../components/product/ProductCharacteristics";
import { getProductById } from "../../../lib/api/products";
import ProductTabs from "../../../components/product/ProductTabs";
import ProductAccessories from "../../../components/product/ProductAccessories";
import ProductServices from "../../../components/product/ProductServices";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  const images = product.images && product.images.length > 0
    ? product.images
    : product.image
      ? [product.image]
      : [];

  return (
    <>
      <Header />

      <main className={styles.page}>
        <h1 className={styles.title}>{product.title}</h1>

        <div className={styles.metaRow}>
          {product.rating && (
            <span className={styles.rating}>
              <span className={styles.star}>★</span> {product.rating}
            </span>
          )}
          {product.reviewsCount !== undefined && (
            <span className={styles.reviewsCount}>{product.reviewsCount} відгуків</span>
          )}
          {product.code && <span className={styles.code}>Код: {product.code}</span>}
        </div>

                {product.seller && (
          <div className={styles.sellerRow}>
            <SellerInfo seller={product.seller} />
          </div>
        )}

        <ProductTabs
          tabs={[
            { id: "characteristics", label: "Характеристики" },
            { id: "accessories", label: "Аксесуари" },
            { id: "services", label: "Сервіси" },
          ]}
        />

        <div className={styles.contentGrid}>
          <div className={styles.leftColumn}>
            <ProductGallery images={images} title={product.title} />

                        {product.characteristics && (
              <div id="characteristics">
                <ProductCharacteristics characteristics={product.characteristics} />
              </div>
            )}

            {product.accessories && <ProductAccessories accessories={product.accessories} />}

            {product.services && <ProductServices services={product.services} />}
          </div>

          <div className={styles.rightColumn}>
            <ProductPriceBox
              price={product.price}
              oldPrice={product.oldPrice}
              isPromo={product.isPromo}
              inStock={product.inStock}
            />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
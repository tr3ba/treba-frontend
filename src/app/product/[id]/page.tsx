import { notFound } from "next/navigation";
import styles from "./page.module.css";
import Header from "../../../components/layout/Header";
import Footer from "../../../components/home/Footer";
import ProductBreadcrumbs from "../../../components/product/ProductBreadcrumbs";
import ProductGallery from "../../../components/product/ProductGallery";
import ProductQuickSpecs from "../../../components/product/ProductQuickSpecs";
import SellerInfo from "../../../components/product/SellerInfo";
import ProductPriceBox from "../../../components/product/ProductPriceBox";
import ProductAddServices from "../../../components/product/ProductAddServices";
import ProductDeliveryInfo from "../../../components/product/ProductDeliveryInfo";
import ProductPaymentInfo from "../../../components/product/ProductPaymentInfo";
import ProductCharacteristics from "../../../components/product/ProductCharacteristics";
import ProductCarousel from "../../../components/product/ProductCarousel";
import ProductBundle from "../../../components/product/ProductBundle";
import ProductDescription from "../../../components/product/ProductDescription";
import ProductReviews from "../../../components/product/ProductReviews";
import ViewedProductTracker from "../../../components/product/ViewedProductTracker";
import ViewedProductsCarousel from "../../../components/product/ViewedProductsCarousel";
import { getProductById, getRelatedProducts, getSponsoredProducts } from "../../../lib/api/products";
import { getProductReviews } from "../../../lib/api/reviews";
import ProductTabs from "../../../components/product/ProductTabs";
import ProductAccessories from "../../../components/product/ProductAccessories";
import ProductServices from "../../../components/product/ProductServices";
import ProductQuestion from "../../../components/product/ProductQuestion";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    notFound();
  }

  const [related, sponsored, reviews] = await Promise.all([
    getRelatedProducts(product.id),
    getSponsoredProducts(product.id),
    getProductReviews(product.backendId),
  ]);

  const images = product.images && product.images.length > 0
    ? product.images
    : product.image
      ? [product.image]
      : [];

  return (
    <>
      <Header />

      <ViewedProductTracker
        id={product.id}
        backendId={product.backendId}
        variantId={product.variantId}
        title={product.title}
        price={product.price}
        oldPrice={product.oldPrice}
        image={product.image}
        rating={product.rating}
        isPromo={product.isPromo}
      />

      <main className={styles.page}>
        <ProductBreadcrumbs categoryId={product.categoryId} />

        <div className={styles.titleRow}>
          <div>
            <h1 className={styles.title}>{product.title}</h1>
            {product.code && <p className={styles.code}>Код: {product.code}</p>}
          </div>

          {product.seller && (
            <div className={styles.sellerRow}>
              <SellerInfo seller={product.seller} />
            </div>
          )}
        </div>

        <ProductTabs
          tabs={[
            { id: "characteristics", label: "Характеристики" },
            { id: "accessories", label: "Аксесуари" },
            { id: "services", label: "Сервіси" },
            { id: "reviews", label: "Відгуки" },
          ]}
        />

        <div className={styles.contentGrid}>
          <div className={styles.leftColumn}>
            <ProductGallery images={images} title={product.title} />

            {product.characteristics && (
              <ProductQuickSpecs characteristics={product.characteristics} />
            )}

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
              id={product.id}
              backendId={product.backendId}
              variantId={product.variantId}
              title={product.title}
              image={product.image}
              price={product.price}
              oldPrice={product.oldPrice}
              isPromo={product.isPromo}
              inStock={product.inStock}
              variants={product.variants}
            />

            {product.services && <ProductAddServices services={product.services} />}

            <ProductDeliveryInfo />
            <ProductPaymentInfo />
            <ProductQuestion id={product.backendId} slug={product.id} title={product.title} />
          </div>
        </div>

        <ProductCarousel title="Також вас можуть зацікавити" products={related} />

        <ProductBundle product={product} />

        <ProductCarousel title="Спонсорські товари" products={sponsored} />

        <div className={styles.descriptionGrid}>
          <ProductDescription title={product.title} description={product.description} />
          <ProductReviews reviews={reviews.items} total={reviews.total} />
        </div>
        <ViewedProductsCarousel excludeId={product.id} />
      </main>

      <Footer />
    </>
  );
}
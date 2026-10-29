import { notFound } from "next/navigation";
import styles from "./page.module.css";
import Header from "../../../../components/layout/Header";
import Footer from "../../../../components/home/Footer";
import ProductBreadcrumbs from "../../../../components/product/ProductBreadcrumbs";
import ProductGallery from "../../../../components/product/ProductGallery";
import ProductQuickSpecs from "../../../../components/product/ProductQuickSpecs";
import SellerInfo from "../../../../components/product/SellerInfo";
import ProductPriceBox from "../../../../components/product/ProductPriceBox";
import ProductAddServices from "../../../../components/product/ProductAddServices";
import ProductDeliveryInfo from "../../../../components/product/ProductDeliveryInfo";
import ProductPaymentInfo from "../../../../components/product/ProductPaymentInfo";
import ProductCharacteristics from "../../../../components/product/ProductCharacteristics";
import ProductCarousel from "../../../../components/product/ProductCarousel";
import ProductBundle from "../../../../components/product/ProductBundle";
import ProductDescription from "../../../../components/product/ProductDescription";
import ProductReviews from "../../../../components/product/ProductReviews";
import ViewedProductTracker from "../../../../components/product/ViewedProductTracker";
import ViewedProductsCarousel from "../../../../components/product/ViewedProductsCarousel";
import { getProductById, getRelatedProducts, getSponsoredProducts } from "../../../../lib/api/products";
import { getProductReviews } from "../../../../lib/api/reviews";
import ProductTabs from "../../../../components/product/ProductTabs";
import ProductAccessories from "../../../../components/product/ProductAccessories";
import ProductServices from "../../../../components/product/ProductServices";
import ProductQuestion from "../../../../components/product/ProductQuestion";

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

  const hasCharacteristics = (product.characteristics?.length ?? 0) > 0;
  const hasAccessories = (product.accessories?.length ?? 0) > 0;
  const hasServices = (product.services?.length ?? 0) > 0;

  // Вкладки — только для разделов, которые реально есть на странице
  const tabs: { id: string; label: string }[] = [];
  if (hasCharacteristics) tabs.push({ id: "characteristics", label: "Характеристики" });
  if (hasAccessories) tabs.push({ id: "accessories", label: "Аксесуари" });
  if (hasServices) tabs.push({ id: "services", label: "Сервіси" });
  tabs.push({ id: "description", label: "Опис" });
  tabs.push({ id: "reviews", label: "Відгуки" });

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

        <ProductTabs tabs={tabs} />

        {/* На телефоне обёртки внутри .body «разбираются» (display: contents),
            и порядок блоков задаётся через order — см. page.module.css */}
        <div className={styles.body}>
          <div className={styles.contentGrid}>
            <div className={styles.leftColumn}>
              <div className={styles.mGallery}>
                <ProductGallery images={images} title={product.title} />
              </div>

              {hasCharacteristics && product.characteristics && (
                <ProductQuickSpecs characteristics={product.characteristics} />
              )}

              {hasCharacteristics && product.characteristics && (
                <div id="characteristics">
                  <ProductCharacteristics characteristics={product.characteristics} />
                </div>
              )}

              {hasAccessories && product.accessories && (
                <ProductAccessories accessories={product.accessories} />
              )}

              {hasServices && product.services && <ProductServices services={product.services} />}
            </div>

            <div className={styles.rightColumn}>
              <div className={styles.mPrice}>
                <ProductPriceBox
                  id={product.id}
                  backendId={product.backendId}
                  variantId={product.variantId}
                  categoryId={product.categoryId}
                  subcategoryId={product.subcategoryId}
                  subcategoryName={product.subcategoryName}
                  title={product.title}
                  image={product.image}
                  price={product.price}
                  oldPrice={product.oldPrice}
                  isPromo={product.isPromo}
                  inStock={product.inStock}
                  variants={product.variants}
                />
              </div>

              {hasServices && product.services && (
                <div className={styles.mAddServices}>
                  <ProductAddServices services={product.services} />
                </div>
              )}

              <ProductDeliveryInfo />
              <ProductPaymentInfo />

              {product.backendId && (
                <div className={styles.mQuestion}>
                  <ProductQuestion id={product.backendId} slug={product.id} title={product.title} />
                </div>
              )}
            </div>
          </div>

          {/* на телефоне карусели идут после отзывов (order: 1) */}
          <div className={styles.mLater}>
            <ProductCarousel title="Також вас можуть зацікавити" products={related} />
          </div>

          <div className={styles.mLater}>
            <ProductBundle product={product} />
          </div>

          <div className={styles.mLater}>
            <ProductCarousel title="Спонсорські товари" products={sponsored} />
          </div>

          <div className={styles.descriptionGrid}>
            <div id="description" className={styles.mDescription}>
              <ProductDescription title={product.title} description={product.description} />
            </div>
            <ProductReviews reviews={reviews.items} total={reviews.total} />
          </div>

          {/* на телефоне «Переглянуті» — самый последний блок (order: 2) */}
          <div className={styles.mLast}>
            <ViewedProductsCarousel excludeId={product.id} />
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
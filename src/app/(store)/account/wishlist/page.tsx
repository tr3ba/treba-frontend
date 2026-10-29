import AccountPageShell from "../../../../components/account/AccountPageShell";
import WishlistView from "../../../../components/wishlist/WishlistView";
import { getCatalogProducts } from "../../../../lib/api/products";
import type { WishlistCardProduct } from "../../../../types/wishlist";

// Товары для сопоставления со списком бажань. Бэк отдаёт в списке только id и название,
// поэтому цену и фото берём из каталога (до 100 товаров — как и в других выборках).
// TODO: когда бэк добавит в WishlistItemDto slug/цену/фото — каталог здесь не понадобится.
async function loadProducts(): Promise<WishlistCardProduct[]> {
  try {
    const products = await getCatalogProducts();
    return products.map(({ id, backendId, variantId, title, price, oldPrice, image, rating, isPromo }) => ({
      id,
      backendId,
      variantId,
      title,
      price,
      oldPrice,
      image,
      rating,
      isPromo,
    }));
  } catch (error) {
    console.error("Не вдалося завантажити товари для списку бажань:", error);
    return [];
  }
}

export default async function WishlistPage() {
  const products = await loadProducts();

  return (
    <AccountPageShell>
      <WishlistView products={products} />
    </AccountPageShell>
  );
}
import styles from "./ProductPriceBox.module.css";

type ProductPriceBoxProps = {
  price: string;
  oldPrice?: string | null;
  isPromo?: boolean;
  inStock?: boolean;
};

export default function ProductPriceBox({ price, oldPrice, isPromo, inStock = true }: ProductPriceBoxProps) {
  return (
    <div className={styles.box}>
      {isPromo && oldPrice && <div className={styles.oldPrice}>{oldPrice}₴</div>}

      <div className={styles.priceRow}>
        <span className={styles.price}>{price}</span>
        <span className={styles.currency}>₴</span>
      </div>

      {inStock ? (
        <button type="button" className={styles.cartButton}>
          Додати в кошик
        </button>
      ) : (
        <>
          <p className={styles.outOfStock}>Товар закінчився</p>
          <button type="button" className={styles.notifyButton}>
            Повідомити про наявність
          </button>
        </>
      )}
    </div>
  );
}
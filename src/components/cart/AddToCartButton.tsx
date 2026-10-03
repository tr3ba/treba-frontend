"use client";

import { useRouter } from "next/navigation";
import { AddToCartInput, useCart } from "../../context/CartContext";
import styles from "./AddToCartButton.module.css";

type AddToCartButtonProps = {
  product: AddToCartInput;
};

// Кругла зелена кнопка на картці товару.
// Перший клік — додає в кошик, повторний — веде в кошик.
export default function AddToCartButton({ product }: AddToCartButtonProps) {
  const router = useRouter();
  const { addItem, isInCart } = useCart();
  const inCart = isInCart(product.id);

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    // кнопка лежить поверх посилання на товар — не даємо кліку піти далі
    event.preventDefault();
    event.stopPropagation();

    if (inCart) {
      router.push("/cart");
    } else {
      addItem(product);
    }
  }

  return (
    <button
      type="button"
      className={`${styles.button} ${inCart ? styles.inCart : ""}`}
      onClick={handleClick}
      aria-label={inCart ? "Товар у кошику — перейти до кошика" : "Додати товар у кошик"}
      title={inCart ? "Вже в кошику" : "Додати в кошик"}
    >
      <img src="/icons/shop1.svg" alt="" className={styles.icon} />
      {inCart && (
        <span className={styles.check} aria-hidden="true">
          ✓
        </span>
      )}
    </button>
  );
}
"use client";

import Link from "next/link";
import { useCart } from "../../context/CartContext";
import HeaderIcon from "./HeaderIcon";
import iconStyles from "./HeaderIcon.module.css";

// Іконка кошика в шапці з лічильником товарів
export default function HeaderCartButton() {
  const { totalCount, isReady } = useCart();
  const count = isReady ? totalCount : 0;

  return (
    <Link
      href="/cart"
      className={iconStyles.action}
      aria-label={count > 0 ? `Кошик, товарів: ${count}` : "Кошик"}
    >
      <HeaderIcon outline="/icons/shop.svg" filled="/icons/shop1.svg" badge={count} />
    </Link>
  );
}
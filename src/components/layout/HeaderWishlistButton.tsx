"use client";

import Link from "next/link";
import { useWishlist } from "../../context/WishlistContext";
import HeaderIcon from "./HeaderIcon";
import iconStyles from "./HeaderIcon.module.css";

type HeaderWishlistButtonProps = {
  /** Доп. класс от шапки (напр. скрыть на телефоне) */
  className?: string;
};

// Сердечко в шапці: посилання на список бажань з лічильником.
// Якщо в списку є товари — сердечко залите.
export default function HeaderWishlistButton({ className }: HeaderWishlistButtonProps) {
  const { count, isReady } = useWishlist();
  const total = isReady ? count : 0;

  const classes = [iconStyles.action, className ?? ""].filter(Boolean).join(" ");

  return (
    <Link
      href="/account/wishlist"
      className={classes}
      aria-label={total > 0 ? `Список бажань, товарів: ${total}` : "Список бажань"}
    >
      <HeaderIcon
        outline="/icons/heart.svg"
        filled="/icons/heart1.svg"
        active={total > 0}
        badge={total}
      />
    </Link>
  );
}
"use client";

import Image from "next/image";
import Link from "next/link";
import type { CartItem } from "../../context/CartContext";
import styles from "./CartToast.module.css";
import Icon from "../common/Icon";

type CartToastProps = {
  item: CartItem | null;
  onClose: () => void;
};

// Сповіщення "Товар додано до кошика"
export default function CartToast({ item, onClose }: CartToastProps) {
  if (!item) return null;

  return (
    <div className={styles.toast} role="status" aria-live="polite">
      <div className={styles.imageWrap}>
        {item.image ? (
          <Image src={item.image} alt="" width={56} height={56} className={styles.image} />
        ) : (
          <Icon src="/icons/catalog.svg" alt="" className={styles.placeholder} />
        )}
      </div>

      <div className={styles.body}>
        <p className={styles.heading}>
          <span className={styles.check} aria-hidden="true">✓</span>
          Товар додано до кошика
        </p>
        <p className={styles.title}>{item.title}</p>
        <Link href="/cart" className={styles.link} onClick={onClose}>
          Перейти до кошика
        </Link>
      </div>

      <button type="button" className={styles.close} onClick={onClose} aria-label="Закрити">
        ×
      </button>
    </div>
  );
}
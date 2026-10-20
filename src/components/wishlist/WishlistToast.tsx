"use client";

import { useEffect } from "react";
import styles from "./WishlistToast.module.css";

type WishlistToastProps = {
  message: string | null;
  onClose: () => void;
};

const TOAST_DURATION = 4000;

// Повідомлення про помилку списку бажань (сама ховається через 4 с)
export default function WishlistToast({ message, onClose }: WishlistToastProps) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, TOAST_DURATION);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className={styles.toast} role="alert">
      <p className={styles.text}>{message}</p>
      <button type="button" className={styles.close} onClick={onClose} aria-label="Закрити">
        ×
      </button>
    </div>
  );
}
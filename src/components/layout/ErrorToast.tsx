"use client";

import { useEffect } from "react";
import styles from "./ErrorToast.module.css";

type ErrorToastProps = {
  message: string | null;
  onClose: () => void;
};

const TOAST_DURATION = 4000;

// Повідомлення про помилку (кошик, список бажань). Саме ховається через 4 с
export default function ErrorToast({ message, onClose }: ErrorToastProps) {
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
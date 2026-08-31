"use client";

import { useEffect, ReactNode } from "react";
import { CloseIcon } from "./Icons";
import styles from "./AuthForm.module.css";

type AuthModalProps = {
  onClose: () => void;
  children: ReactNode;
};

export default function AuthModal({ onClose, children }: AuthModalProps) {
  // Пока модалка открыта — страница под ней не скроллится
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Закрытие по Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className={styles.overlay}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={styles.card}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Закрити"
        >
          <CloseIcon />
        </button>

        {children}
      </div>
    </div>
  );
}
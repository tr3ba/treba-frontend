"use client";

import { useEffect, useRef, ReactNode } from "react";
import { CloseIcon } from "./Icons";
import styles from "./AuthForm.module.css";

type AuthModalProps = {
  onClose: () => void;
  children: ReactNode;
};

export default function AuthModal({ onClose, children }: AuthModalProps) {
  // Нажатие началось на затемнении? Иначе выделение текста в поле
  // с отпусканием снаружи закрывало бы окно
  const pressedOnOverlayRef = useRef(false);

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

  // Закрытие по клику / тапу на пустое место вокруг окна
  const handleOverlayPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pressedOnOverlayRef.current = e.target === e.currentTarget;
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const shouldClose = pressedOnOverlayRef.current && e.target === e.currentTarget;
    pressedOnOverlayRef.current = false;
    if (shouldClose) onClose();
  };

  return (
    <div
      className={styles.overlay}
      onPointerDown={handleOverlayPointerDown}
      onClick={handleOverlayClick}
      role="presentation"
    >
      <div className={styles.card} role="dialog" aria-modal="true">
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
"use client";

import { useEffect, useRef, ReactNode } from "react";
import { CloseIcon } from "./Icons";
import styles from "./AuthForm.module.css";
import {
  AdminI18nProvider,
  useAdminI18n,
} from "@/features/admin/i18n/provider";
import { languageCookie } from "@/features/admin/i18n/core";
import LanguageSelector from "@/components/admin/LanguageSelector";

type AuthModalProps = {
  onClose: () => void;
  children: ReactNode;
};

export default function AuthModal(props: AuthModalProps) {
  return (
    <AdminI18nProvider manageDocumentTitle={false}>
      <LocalizedAuthModal {...props} />
    </AdminI18nProvider>
  );
}
function LocalizedAuthModal({ onClose, children }: AuthModalProps) {
  const { t, adoptProfileLanguage } = useAdminI18n();
  useEffect(() => {
    const preference = document.cookie
      .split(";")
      .map((value) => value.trim())
      .find((value) => value.startsWith(languageCookie + "="))
      ?.split("=")[1];
    adoptProfileLanguage(preference);
  }, [adoptProfileLanguage]);
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
    const shouldClose =
      pressedOnOverlayRef.current && e.target === e.currentTarget;
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
      <div
        className={`${styles.card} ${styles.localizedCard}`}
        role="dialog"
        aria-modal="true"
      >
        <div className={styles.languageBar}>
          <LanguageSelector />
        </div>
        <button
          type="button"
          className={styles.closeButton}
          onClick={onClose}
          aria-label={t("Закрити")}
        >
          <CloseIcon />
        </button>

        {children}
      </div>
    </div>
  );
}

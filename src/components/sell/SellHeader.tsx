"use client";

import { useSyncExternalStore } from "react";
import Link from "next/link";
import styles from "./SellHeader.module.css";
import Icon from "../common/Icon";

const NAV_LINKS = [
  { href: "#advantages", label: "Переваги" },
  { href: "#how", label: "Як почати" },
  { href: "#calculator", label: "Калькулятор" },
  { href: "#faq", label: "Питання" },
];

// Прокручена ли страница — без setState в эффекте
function subscribeScroll(callback: () => void) {
  window.addEventListener("scroll", callback, { passive: true });
  return () => window.removeEventListener("scroll", callback);
}

const getScrolled = () => window.scrollY > 8;
const getServerScrolled = () => false;

// Хедер лендинга: логотип, навигация по блокам, кнопка заявки
export default function SellHeader() {
  const scrolled = useSyncExternalStore(subscribeScroll, getScrolled, getServerScrolled);

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ""}`}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logoLink} aria-label="TREBA — на головну">
          <Icon src="/logo/MainLogo.svg" alt="TREBA" className={styles.logo} />
          <span className={styles.logoTag}>для продавців</span>
        </Link>

        <nav className={styles.nav} aria-label="Розділи сторінки">
          {NAV_LINKS.map((link) => (
            <a key={link.href} href={link.href} className={styles.navLink}>
              {link.label}
            </a>
          ))}
        </nav>

        <div className={styles.actions}>
          <Link href="/" className={styles.storeLink}>
            До магазину
          </Link>
          <a href="#apply" className={styles.cta}>
            Подати заявку
          </a>
        </div>
      </div>
    </header>
  );
}
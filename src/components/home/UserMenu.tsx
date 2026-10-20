"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import styles from "./UserMenu.module.css";
import { adminOrigin, canOpenAdmin } from "../../lib/admin";

export default function UserMenu() {
  const { user, isLoading, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <button className={styles.actionButton} aria-label="Профіль">
        <span className={`${styles.iconSwap} ${styles.userIcon}`}>
          <img src="/icons/user.svg" alt="" className={styles.iconOutline} />
          <img src="/icons/user1.svg" alt="" className={styles.iconFilled} />
        </span>
      </button>
    );
  }

  if (!user) {
    return (
      <Link href="/login" className={styles.actionButton} aria-label="Увійти">
        <span className={`${styles.iconSwap} ${styles.userIcon}`}>
          <img src="/icons/user.svg" alt="" className={styles.iconOutline} />
          <img src="/icons/user1.svg" alt="" className={styles.iconFilled} />
        </span>
      </Link>
    );
  }

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        className={styles.actionButton}
        aria-label="Профіль"
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span className={`${styles.iconSwap} ${styles.userIcon}`}>
          <img src="/icons/user.svg" alt="" className={styles.iconOutline} />
          <img src="/icons/user1.svg" alt="" className={styles.iconFilled} />
        </span>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <p className={styles.userName}>{user.name}</p>
          <p className={styles.userEmail}>{user.email}</p>
          <Link
            href="/account"
            className={styles.accountLink}
            onClick={() => setIsOpen(false)}
          >
            Особистий кабінет
          </Link>
          <Link
            href="/sell"
            className={styles.accountLink}
            onClick={() => setIsOpen(false)}
          >
            Стати продавцем
          </Link>
          {canOpenAdmin(user.role) && <a href={adminOrigin + "/site-login/start"} className={styles.accountLink}>Адмін-панель</a>}
          <button
            className={styles.logoutButton}
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
          >
            Вийти
          </button>
        </div>
      )}
    </div>
  );
}

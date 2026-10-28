"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import styles from "./UserMenu.module.css";
import { adminOrigin, canOpenAdmin, canApplyAsSeller, roleLabel, workspaceLabel } from "../../lib/admin";
import HeaderIcon from "../layout/HeaderIcon";
import iconStyles from "../layout/HeaderIcon.module.css";

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
      <button className={iconStyles.action} aria-label="Профіль">
        <HeaderIcon outline="/icons/user.svg" filled="/icons/user1.svg" />
      </button>
    );
  }

  if (!user) {
    return (
      <Link href="/login" className={iconStyles.action} aria-label="Увійти">
        <HeaderIcon outline="/icons/user.svg" filled="/icons/user1.svg" />
      </Link>
    );
  }

  return (
    <div className={styles.wrapper} ref={wrapperRef}>
      <button
        className={iconStyles.action}
        aria-label="Профіль"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <HeaderIcon outline="/icons/user.svg" filled="/icons/user1.svg" active={isOpen} />
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <p className={styles.userName}>{user.name}</p>
          <p className={styles.userEmail}>{user.email}</p>
          {roleLabel(user.role) && <span className={styles.roleBadge}>{roleLabel(user.role)}</span>}
          {!canOpenAdmin(user.role) && <Link href="/account/notifications" className={styles.accountLink} onClick={() => setIsOpen(false)}>Сповіщення</Link>}
          {canOpenAdmin(user.role) && <a href={adminOrigin + "/site-login/start"} className={styles.accountLink}>{workspaceLabel(user.role)}</a>}
          {!canOpenAdmin(user.role) && <Link
            href="/account"
            className={styles.accountLink}
            onClick={() => setIsOpen(false)}
          >
            Особистий кабінет
          </Link>}
          {canApplyAsSeller(user.role) && <Link
            href="/sell"
            className={styles.accountLink}
            onClick={() => setIsOpen(false)}
          >
            Стати продавцем
          </Link>}
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

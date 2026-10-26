"use client";

import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { useComparison } from "../../context/ComparisonContext";
import HeaderIcon from "./HeaderIcon";
import iconStyles from "./HeaderIcon.module.css";

type HeaderCompareButtonProps = {
  /** Доп. класс от шапки (напр. скрыть на телефоне) */
  className?: string;
};

// Терези в шапці: списки порівняння з лічильником. Показуємо тільки після входу.
// Якщо в порівнянні є товари — терези залиті.
export default function HeaderCompareButton({ className }: HeaderCompareButtonProps) {
  const { user } = useAuth();
  const { count, isReady } = useComparison();

  if (!user) return null;

  const total = isReady ? count : 0;
  const classes = [iconStyles.action, className ?? ""].filter(Boolean).join(" ");

  return (
    <Link
      href="/account/comparisons"
      className={classes}
      aria-label={total > 0 ? `Порівняння, товарів: ${total}` : "Порівняння"}
    >
      <HeaderIcon
        outline="/icons/balance.svg"
        filled="/icons/balance1.svg"
        wide
        active={total > 0}
        badge={total}
      />
    </Link>
  );
}
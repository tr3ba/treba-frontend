"use client";

import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import HeaderIcon from "./HeaderIcon";
import iconStyles from "./HeaderIcon.module.css";

type HeaderCompareButtonProps = {
  /** Доп. класс от шапки (напр. скрыть на телефоне) */
  className?: string;
};

// Весы в шапці: порівняння товарів. Показуємо тільки після входу.
// Лічильника поки немає — функціонал порівняння ще не зроблено.
export default function HeaderCompareButton({ className }: HeaderCompareButtonProps) {
  const { user } = useAuth();

  if (!user) return null;

  const classes = [iconStyles.action, className ?? ""].filter(Boolean).join(" ");

  return (
    <Link href="/account/comparisons" className={classes} aria-label="Порівняння">
      <HeaderIcon outline="/icons/balance.svg" filled="/icons/balance1.svg" wide />
    </Link>
  );
}
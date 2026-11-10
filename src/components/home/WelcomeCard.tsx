"use client";

import Link from "next/link";
import { useAuth } from "../../context/AuthContext";
import { canOpenAdmin, workspaceLabel } from "../../lib/admin";
import pageStyles from "../../app/(store)/page.module.css";
import styles from "./WelcomeCard.module.css";

// Картка «Ласкаво просимо!» на головній.
// Гість — кнопка відкриває вхід (модалка через intercepting route /login).
// Покупець — посилання в кабінет, співробітник — у робочий простір.
export default function WelcomeCard() {
  const { user } = useAuth();
  const buttonClass = `${pageStyles.welcomeButton} ${styles.link}`;

  if (!user) {
    return (
      <section className={pageStyles.welcomeCard}>
        <h2 className={pageStyles.welcomeTitle}>Ласкаво просимо!</h2>
        <p className={pageStyles.welcomeText}>
          Увійдіть, щоб отримувати рекомендації, персональні бонуси та знижки.
        </p>
        <Link href="/login" className={buttonClass}>
          Увійдіть до особистого кабінету
        </Link>
      </section>
    );
  }

  const greeting = user.firstName?.trim() || user.name.split(" ")[0];
  const isStaff = canOpenAdmin(user.role);

  return (
    <section className={pageStyles.welcomeCard}>
      <h2 className={pageStyles.welcomeTitle}>{greeting ? `Вітаємо, ${greeting}!` : "Вітаємо!"}</h2>
      <p className={pageStyles.welcomeText}>
        {isStaff
          ? "Керуйте товарами, замовленнями та відгуками в робочому просторі."
          : "Замовлення, список бажань і персональні пропозиції — в особистому кабінеті."}
      </p>
      <Link href={isStaff ? "/admin" : "/account"} className={buttonClass}>
        {isStaff ? workspaceLabel(user.role) : "Перейти до кабінету"}
      </Link>
    </section>
  );
}
import Link from "next/link";
import styles from "./SellFooter.module.css";
import Icon from "../common/Icon";

// Короткий футер лендинга
export default function SellFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Link href="/" aria-label="TREBA — на головну">
            <Icon src="/logo/MainLogo.svg" alt="TREBA" className={styles.logo} />
          </Link>
          <p className={styles.tagline}>
            Український маркетплейс. Продавайте разом із нами.
          </p>
        </div>

        <nav className={styles.links} aria-label="Посилання у футері">
          <Link href="/" className={styles.link}>
            Головна сторінка магазину
          </Link>
          <a href="#faq" className={styles.link}>
            Часті запитання
          </a>
          <a href="#apply" className={styles.link}>
            Подати заявку
          </a>
        </nav>
      </div>

      <div className={styles.bottom}>
        <p>© 2021–2026 TREBA. Усі права захищені.</p>
      </div>
    </footer>
  );
}
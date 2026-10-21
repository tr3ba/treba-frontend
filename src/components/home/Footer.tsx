import Link from "next/link";
import styles from "./Footer.module.css";
import Icon from "../common/Icon";

type FooterLink = {
  label: string;
  href: string;
};

type FooterColumn = {
  title: string;
  links: FooterLink[];
};

const socialLinks = [
  { name: "TikTok", icon: "/icons/TikTok.svg" },
  { name: "Telegram", icon: "/icons/telegram.svg" },
  { name: "Facebook", icon: "/icons/facebook.svg" },
  { name: "YouTube", icon: "/icons/youtube.svg" },
  { name: "Instagram", icon: "/icons/instagram.svg" },
  { name: "X", icon: "/icons/x.svg" },
];

// Ссылки с "#" — страницы ещё не сделаны
const linkColumns: FooterColumn[] = [
  {
    title: "Про компанію",
    links: [
      { label: "Про нас", href: "#" },
      { label: "Умови використання сайту", href: "#" },
      { label: "Вакансії", href: "#" },
      { label: "Контакти", href: "#" },
    ],
  },
  {
    title: "Допомога",
    links: [
      { label: "Доставка та оплата", href: "#" },
      { label: "Гарантія", href: "#" },
      { label: "Повернення товару", href: "#" },
    ],
  },
  {
    title: "Партнерам",
    links: [
      { label: "Продавати на TREBA", href: "/sell" },
      { label: "Реклама на TREBA", href: "#" },
      { label: "Співпраця з нами", href: "#" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.topLine} aria-hidden="true" />

      <div className={styles.inner}>
        <div className={styles.columns}>
          <div className={styles.socialColumn}>
            <p className={styles.columnTitle}>Ми в соціальних мережах</p>
            <div className={styles.socialRow}>
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href="#"
                  className={styles.socialIcon}
                  aria-label={social.name}
                >
                  <Icon src={social.icon} alt={social.name} />
                </a>
              ))}
            </div>
          </div>

          {linkColumns.map((column) => (
            <div key={column.title} className={styles.linkColumn}>
              <p className={styles.columnTitle}>{column.title}</p>
              {column.links.map((link) => (
                <Link key={link.label} href={link.href} className={styles.footerLink}>
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <div className={styles.bottomRow}>
          <p className={styles.copyright}>
            © 2021–2026 Інтернет-магазин «TREBA» — Всі права захищені
          </p>
        </div>
      </div>
    </footer>
  );
}
import Link from "next/link";
import styles from "./Footer.module.css";
import Icon from "../common/Icon";
import { SOCIAL_LINKS } from "../../data/socialLinks";

type FooterLink = {
  label: string;
  href: string;
};

type FooterColumn = {
  title: string;
  links: FooterLink[];
};

// Інфосторінки — /info/[slug], тексти в src/data/infoPages.ts
const linkColumns: FooterColumn[] = [
  {
    title: "Про компанію",
    links: [
      { label: "Про нас", href: "/info/about" },
      { label: "Умови використання сайту", href: "/info/terms" },
      { label: "Вакансії", href: "/info/careers" },
      { label: "Контакти", href: "/info/contacts" },
    ],
  },
  {
    title: "Допомога",
    links: [
      { label: "Доставка та оплата", href: "/info/delivery" },
      { label: "Гарантія", href: "/info/warranty" },
      { label: "Повернення товару", href: "/info/returns" },
    ],
  },
  {
    title: "Партнерам",
    links: [
      { label: "Продавати на TREBA", href: "/sell" },
      { label: "Реклама на TREBA", href: "/info/advertising" },
      { label: "Співпраця з нами", href: "/info/partnership" },
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
              {SOCIAL_LINKS.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
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
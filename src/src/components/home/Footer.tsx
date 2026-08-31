import styles from "./Footer.module.css";

const socialLinks = [
  { name: "TikTok", icon: "/icons/TikTok.svg" },
  { name: "Telegram", icon: "/icons/telegram.svg" },
  { name: "Facebook", icon: "/icons/facebook.svg" },
  { name: "YouTube", icon: "/icons/youtube.svg" },
  { name: "Instagram", icon: "/icons/instagram.svg" },
  { name: "X", icon: "/icons/x.svg" },
];

const linkColumns = [
  {
    title: "Про компанію",
    links: ["Про нас", "Умови використання сайту", "Вакансії", "Контакти"],
  },
  {
    title: "Допомога",
    links: ["Доставка та оплата", "Гарантія", "Повернення товару"],
  },
  {
    title: "Партнерам",
    links: ["Продавати на TREBA", "Реклама на TREBA", "Співпраця з нами"],
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
                  <img src={social.icon} alt={social.name} />
                </a>
              ))}
            </div>
          </div>

          {linkColumns.map((column) => (
            <div key={column.title} className={styles.linkColumn}>
              <p className={styles.columnTitle}>{column.title}</p>
              {column.links.map((link) => (
                <a key={link} href="#" className={styles.footerLink}>
                  {link}
                </a>
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
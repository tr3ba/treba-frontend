import Link from "next/link";
import type { InfoNavGroup, InfoPage } from "../../types/infoPage";
import styles from "./InfoPageView.module.css";

type Props = {
  page: InfoPage;
  navigation: InfoNavGroup[];
};

// Інформаційна сторінка: бічне меню (на телефоні — горизонтальні «таблетки») + текст.
export default function InfoPageView({ page, navigation }: Props) {
  return (
    <div className={styles.layout}>
      <nav className={styles.breadcrumbs} aria-label="Навігаційний ланцюжок">
        <Link href="/" className={styles.breadcrumbLink}>
          Головна
        </Link>
        <span className={styles.breadcrumbSeparator} aria-hidden="true">
          /
        </span>
        <span className={styles.breadcrumbCurrent}>{page.title}</span>
      </nav>

      <div className={styles.columns}>
        <aside className={styles.sidebar}>
          <nav aria-label="Інформація для покупців">
            {navigation.map((group) => (
              <div key={group.group} className={styles.navGroup}>
                <p className={styles.navGroupTitle}>{group.group}</p>
                <ul className={styles.navList}>
                  {group.links.map((link) => {
                    const isActive = link.slug === page.slug;
                    return (
                      <li key={link.slug}>
                        <Link
                          href={`/info/${link.slug}`}
                          className={`${styles.navLink} ${isActive ? styles.navLinkActive : ""}`}
                          aria-current={isActive ? "page" : undefined}
                        >
                          {link.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <article className={styles.content}>
          <h1 className={styles.title}>{page.title}</h1>
          <p className={styles.description}>{page.description}</p>

          {page.sections.map((section, index) => (
            <section key={section.heading ?? index} className={styles.section}>
              {section.heading && <h2 className={styles.sectionTitle}>{section.heading}</h2>}
              {section.paragraphs?.map((paragraph) => (
                <p key={paragraph} className={styles.paragraph}>
                  {paragraph}
                </p>
              ))}
              {section.list && (
                <ul className={styles.list}>
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          {page.action && (
            <Link href={page.action.href} className={styles.action}>
              {page.action.label}
            </Link>
          )}
        </article>
      </div>
    </div>
  );
}
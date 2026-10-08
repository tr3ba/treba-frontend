"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCategories } from "../../context/CategoriesContext";
import styles from "./MobileCatalog.module.css";

// Бургер + выезжающая панель каталога для планшета и телефона (≤1024px).
// На ПК вместо неё работает CatalogMenu (кнопка «Каталог» с меню по наведению).
export default function MobileCatalog() {
  const categories = useCategories();
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const activeCategory = categories.find((category) => category.id === activeId) ?? null;

  const open = () => {
    setActiveId(null);
    setIsOpen(true);
  };

  const close = () => setIsOpen(false);

  // Пока панель открыта: страница под ней не прокручивается, Esc закрывает панель
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        type="button"
        className={styles.burger}
        aria-label="Каталог товарів"
        aria-expanded={isOpen}
        onClick={open}
      >
        <img src="/icons/menu.svg" alt="" className={styles.burgerIcon} />
      </button>

      {isOpen && (
        <div className={styles.root}>
          <div className={styles.overlay} onClick={close} aria-hidden="true" />

          <div className={styles.drawer} role="dialog" aria-modal="true" aria-label="Каталог товарів">
            <div className={styles.drawerHeader}>
              {activeCategory ? (
                <button type="button" className={styles.backButton} onClick={() => setActiveId(null)}>
                  <ChevronIcon className={styles.backIcon} />
                  Усі категорії
                </button>
              ) : (
                <p className={styles.drawerTitle}>Каталог</p>
              )}

              <button type="button" className={styles.closeButton} aria-label="Закрити каталог" onClick={close}>
                <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
                  <path
                    d="M4 4l12 12M16 4L4 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>

            <div className={styles.drawerBody}>
              {activeCategory ? (
                <>
                  <p className={styles.levelTitle}>{activeCategory.label}</p>
                  <Link href={`/catalog/${activeCategory.id}`} className={styles.allLink} onClick={close}>
                    Усі товари категорії
                  </Link>

                  {activeCategory.subcategories?.map((column) => (
                    <div key={column.title} className={styles.group}>
                      <p className={styles.groupTitle}>{column.title}</p>
                      {/* окремих сторінок підкатегорій поки немає — ведемо на сторінку категорії */}
                      {column.items.map((item) => (
                        <Link
                          key={item}
                          href={`/catalog/${activeCategory.id}`}
                          className={styles.groupItem}
                          onClick={close}
                        >
                          {item}
                        </Link>
                      ))}
                    </div>
                  ))}
                </>
              ) : categories.length === 0 ? (
                <p className={styles.emptyText}>Каталог тимчасово недоступний. Спробуйте пізніше.</p>
              ) : (
                categories.map((category) => {
                  const hasSubcategories = (category.subcategories?.length ?? 0) > 0;

                  const content = (
                    <>
                      <img src={category.icon} alt="" className={styles.rowIcon} />
                      <span className={styles.rowLabel}>{category.label}</span>
                      {hasSubcategories && <ChevronIcon className={styles.rowChevron} />}
                    </>
                  );

                  return hasSubcategories ? (
                    <button
                      key={category.id}
                      type="button"
                      className={styles.row}
                      onClick={() => setActiveId(category.id)}
                    >
                      {content}
                    </button>
                  ) : (
                    <Link key={category.id} href={`/catalog/${category.id}`} className={styles.row} onClick={close}>
                      {content}
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Стрелка «вправо»; для кнопки «назад» разворачивается через CSS
function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <path
        d="M6 3l5 5-5 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
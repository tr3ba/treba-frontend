"use client";

import { useRef, useState } from "react";
import styles from "./CatalogMenu.module.css";
import { categories } from "../../data/categories";

const CLOSE_DELAY = 200;

const defaultActiveId = categories.find((c) => c.subcategories?.length)?.id ?? null;

export default function CatalogMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeCategory = categories.find((c) => c.id === activeId);

  const handleOpen = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    setIsOpen(true);
    setActiveId((prev) => prev ?? defaultActiveId);
  };

  const handleClose = () => {
    closeTimer.current = setTimeout(() => {
      setIsOpen(false);
      setActiveId(null);
    }, CLOSE_DELAY);
  };

  return (
    <div
      className={styles.wrapper}
      onMouseEnter={handleOpen}
      onMouseLeave={handleClose}
    >
      <button className={styles.catalogButton} type="button">
        <img src="/icons/catalog.svg" alt="" className={styles.catalogIcon} />
        <span className={styles.catalogText}>Каталог</span>
      </button>

      {isOpen && (
        <div className={styles.megaMenu}>
          <div className={styles.categoryList}>
            {categories.map((category) => {
              const isActive = category.id === activeId;
              return (
                <a
                  key={category.id}
                  href="#"
                  className={`${styles.categoryRow} ${isActive ? styles.categoryRowActive : ""}`}
                  onMouseEnter={() => setActiveId(category.id)}
                >
                  <img
                    src={category.icon}
                    alt=""
                    className={styles.categoryRowIcon}
                  />
                  <span className={styles.categoryRowLabel}>{category.label}</span>
                  {category.subcategories && (
                    <img
                      src="/icons/arrow.svg"
                      alt=""
                      className={styles.categoryRowArrow}
                    />
                  )}
                </a>
              );
            })}
          </div>

          {activeCategory?.subcategories && activeCategory.subcategories.length > 0 && (
            <div className={styles.subcategoriesPanel}>
              {activeCategory.subcategories.map((column) => (
                <div key={column.title} className={styles.subcatGroup}>
                  <p className={styles.subcatTitle}>{column.title}</p>
                  {column.items.map((item) => (
                    <a key={item} href="#" className={styles.subcatItem}>
                      {item}
                    </a>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
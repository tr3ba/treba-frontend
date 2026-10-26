"use client";

import { useCallback, useState } from "react";
import Icon from "../common/Icon";
import MobileCatalogDrawer from "./MobileCatalogDrawer";
import styles from "./MobileCatalog.module.css";

// Бургер с каталогом в шапке — только на планшете (769–1024px).
// На ПК вместо него CatalogMenu, на телефоне — вкладка «Каталог» в нижней панели.
export default function MobileCatalog() {
  const [isOpen, setIsOpen] = useState(false);
  const close = useCallback(() => setIsOpen(false), []);

  return (
    <>
      <button
        type="button"
        className={styles.burger}
        aria-label="Каталог товарів"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(true)}
      >
        <Icon src="/icons/menu.svg" alt="" className={styles.burgerIcon} />
      </button>

      <MobileCatalogDrawer isOpen={isOpen} onClose={close} />
    </>
  );
}
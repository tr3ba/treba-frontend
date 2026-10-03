import Link from "next/link";
import { categories } from "../../data/categories";
import styles from "./ProductBreadcrumbs.module.css";

type ProductBreadcrumbsProps = {
  categoryId?: string;
};

export default function ProductBreadcrumbs({ categoryId }: ProductBreadcrumbsProps) {
  const category = categories.find((item) => item.id === categoryId);

  return (
    <nav className={styles.breadcrumbs} aria-label="Хлібні крихти">
      <Link href="/" className={styles.crumb}>
        Головна
      </Link>
      <span className={styles.separator}>/</span>
      <span className={styles.crumbCurrent}>{category ? category.label : "Каталог"}</span>
    </nav>
  );
}
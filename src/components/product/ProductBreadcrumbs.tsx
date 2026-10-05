import Link from "next/link";
import { getCategoryById } from "../../lib/api/categories";
import type { Category } from "../../types/category";
import styles from "./ProductBreadcrumbs.module.css";

type ProductBreadcrumbsProps = {
  categoryId?: string;
};

// Категорию ищем через API-слой; если бэк недоступен — показываем «Каталог»
async function findCategory(categoryId?: string): Promise<Category | null> {
  if (!categoryId) return null;
  try {
    return await getCategoryById(categoryId);
  } catch {
    return null;
  }
}

export default async function ProductBreadcrumbs({ categoryId }: ProductBreadcrumbsProps) {
  const category = await findCategory(categoryId);

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
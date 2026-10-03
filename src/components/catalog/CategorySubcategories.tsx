import Image from "next/image";
import Link from "next/link";
import { SubcategoryColumn } from "../../data/categories";
import styles from "./CategorySubcategories.module.css";

type CategorySubcategoriesProps = {
  categoryId: string;
  subcategories: SubcategoryColumn[];
};

export default function CategorySubcategories({
  categoryId,
  subcategories,
}: CategorySubcategoriesProps) {
  const groups = subcategories.filter((group) => group.items.length > 0);

  if (groups.length === 0) return null;

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Розділи категорії</h2>

      <div className={styles.grid}>
        {groups.map((group) => (
          <Link
            key={group.title}
            href={`/catalog/${categoryId}?section=${encodeURIComponent(group.title)}`}
            className={styles.card}
          >
            <div className={styles.cardImageWrap}>
              {group.image ? (
                <Image
                  src={group.image}
                  alt=""
                  fill
                  unoptimized
                  className={styles.cardImage}
                  sizes="260px"
                />
              ) : (
                <div className={styles.cardImagePlaceholder} aria-hidden="true">
                  <img src="/icons/catalog.svg" alt="" className={styles.cardImagePlaceholderIcon} />
                </div>
              )}
            </div>

            <div className={styles.cardHead}>
              <span className={styles.cardTitle}>{group.title}</span>
              <span className={styles.cardCount}>{group.items.length}</span>
            </div>

            <p className={styles.cardItems}>
              {group.items.slice(0, 4).join(", ")}
              {group.items.length > 4 ? "…" : ""}
            </p>

            <span className={styles.cardLink}>
              Переглянути розділ
              <img src="/icons/arrow.svg" alt="" className={styles.cardLinkArrow} />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
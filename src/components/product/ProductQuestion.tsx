import Link from "next/link";
import styles from "./ProductQuestion.module.css";

type ProductQuestionProps = {
  /** Guid товара на бэке — без него переписку не открыть */
  id?: string;
  slug: string;
  title: string;
};

// Блок «Є питання про товар?» — ведёт в переписку с підтримкою
export default function ProductQuestion({ id, slug, title }: ProductQuestionProps) {
  if (!id) return null;

  const href =
    `/account/messages?product=${encodeURIComponent(id)}` +
    `&slug=${encodeURIComponent(slug)}&title=${encodeURIComponent(title)}`;

  return (
    <section className={styles.box}>
      <div className={styles.textGroup}>
        <h2 className={styles.title}>Є питання про товар?</h2>
        <p className={styles.text}>
          Уточніть характеристики або умови покупки в особистій переписці з підтримкою TREBA.
        </p>
      </div>

      <Link href={href} className={styles.button}>
        Задати питання
      </Link>
    </section>
  );
}
import styles from "./ProductDescription.module.css";

type ProductDescriptionProps = {
  title: string;
  description?: string;
};

const FALLBACK_TEXT =
  "Детальний опис цього товару ще готується. Найближчим часом тут з'явиться повна інформація про особливості, переваги та рекомендації щодо використання.";

export default function ProductDescription({ title, description }: ProductDescriptionProps) {
  return (
    <section className={styles.section}>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.text}>{description ?? FALLBACK_TEXT}</p>
    </section>
  );
}
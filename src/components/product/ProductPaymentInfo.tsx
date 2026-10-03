import styles from "./ProductPaymentInfo.module.css";

export default function ProductPaymentInfo() {
  return (
    <div className={styles.box}>
      <p className={styles.row}>
        <span className={styles.label}>Оплата.</span>
        <span className={styles.text}>
          Оплата під час отримання товару, карткою онлайн, Apple Pay, Google Pay або частинами.
        </span>
      </p>

      <p className={styles.row}>
        <span className={styles.label}>Гарантія.</span>
        <span className={styles.text}>
          12 місяців. Обмін або повернення товару впродовж 14 днів.
        </span>
      </p>
    </div>
  );
}
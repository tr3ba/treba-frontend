import styles from "./ProductDeliveryInfo.module.css";

export default function ProductDeliveryInfo() {
  return (
    <div className={styles.box}>
      <p className={styles.title}>
        Доставка:{" "}
        <button type="button" className={styles.cityButton}>
          обрати місто
        </button>
      </p>

      <div className={styles.row}>
        <img src="/icons/box.svg" alt="" className={styles.icon} />
        <div className={styles.rowText}>
          <span className={styles.rowTitle}>Самовивіз з відділень</span>
          <span className={styles.rowSubtitle}>Найближчим часом після оформлення</span>
        </div>
      </div>

      <div className={styles.row}>
        <img src="/icons/delivery.svg" alt="" className={styles.icon} />
        <div className={styles.rowText}>
          <span className={styles.rowTitle}>Доставка кур&apos;єром</span>
          <span className={styles.rowSubtitle}>За тарифами перевізника</span>
        </div>
      </div>
    </div>
  );
}
import Header from "./Header";
import styles from "./PageLoader.module.css";

const SKELETON_CARDS = 6;

// Скелетон страницы: показывается, пока сервер загружает данные (app/loading.tsx)
export default function PageLoader() {
  return (
    <>
      <Header />

      <main className={styles.page} aria-busy="true">
        <span className={styles.srOnly} role="status">
          Завантаження…
        </span>

        <div className={`${styles.block} ${styles.title}`} />
        <div className={`${styles.block} ${styles.subtitle}`} />

        <div className={styles.grid} aria-hidden="true">
          {Array.from({ length: SKELETON_CARDS }, (_, index) => (
            <div key={index} className={styles.card}>
              <div className={`${styles.block} ${styles.cardImage}`} />
              <div className={`${styles.block} ${styles.cardLine}`} />
              <div className={`${styles.block} ${styles.cardLineShort}`} />
              <div className={`${styles.block} ${styles.cardPrice}`} />
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
import styles from "./EmptyState.module.css";

type EmptyStateProps = {
  icon: string;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
};

// Мінімалістична заглушка для розділів без даних
export default function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <section className={styles.wrapper}>
      <div className={styles.iconCircle}>
        <img src={icon} alt="" className={styles.icon} />
      </div>
      <h2 className={styles.title}>{title}</h2>
      <p className={styles.subtitle}>{subtitle}</p>
      {actionLabel && (
        <button type="button" className={styles.actionButton} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </section>
  );
}
import Icon from "../common/Icon";
import styles from "./HeaderIcon.module.css";

type HeaderIconProps = {
  /** Контурная иконка (обычное состояние) */
  outline: string;
  /** Залитая иконка (наведение, фокус, active) */
  filled: string;
  /** Широкая иконка (весы порівняння) — бокс шире, чтобы визуально совпадала с остальными */
  wide?: boolean;
  /** Залита без наведения: открыто меню, в списке есть товары */
  active?: boolean;
  /** Число в бейдже; 0 — бейдж скрыт */
  badge?: number;
};

// Общая иконка шапки: одинаковый размер, hover контур -> заливка, бейдж-счётчик.
// Родитель (Link или button) должен иметь класс .action из HeaderIcon.module.css —
// на нём срабатывает наведение и фокус.
export default function HeaderIcon({
  outline,
  filled,
  wide = false,
  active = false,
  badge = 0,
}: HeaderIconProps) {
  const classes = [styles.root, wide ? styles.wide : "", active ? styles.active : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={classes}>
      <span className={styles.swap}>
        <Icon src={outline} alt="" className={styles.outline} />
        <Icon src={filled} alt="" className={styles.filled} />
      </span>

      {/* key — чтобы бейдж «подпрыгивал» при каждом изменении числа; число уже есть в aria-label родителя */}
      {badge > 0 && (
        <span className={styles.badge} key={badge} aria-hidden="true">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </span>
  );
}
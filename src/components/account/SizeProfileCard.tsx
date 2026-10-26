import { GENDER_OPTIONS, MEASUREMENT_FIELDS } from "../../data/sizeCharts";
import type { SizeProfile } from "../../types/sizes";
import styles from "./SizeProfileCard.module.css";

type SizeProfileCardProps = {
  profile: SizeProfile;
  disabled?: boolean;
  onEdit: (profile: SizeProfile) => void;
  onRemove: (profile: SizeProfile) => void;
};

// 24.5 -> "24,5"
function formatCm(value: number): string {
  return String(value).replace(".", ",");
}

// Картка профілю розмірів: назва, розміри плашками, параметри рядком
export default function SizeProfileCard({ profile, disabled = false, onEdit, onRemove }: SizeProfileCardProps) {
  const genderLabel = GENDER_OPTIONS.find((option) => option.id === profile.gender)?.label ?? "";

  const sizes = [
    { label: "Верх", value: profile.topSize },
    { label: "Низ", value: profile.bottomSize },
    { label: "Взуття", value: profile.shoeSize },
  ].filter((item): item is { label: string; value: string } => Boolean(item.value));

  const params = MEASUREMENT_FIELDS.flatMap((field) => {
    const value = profile.measurements[field.key];
    return value !== undefined ? [`${field.short} ${formatCm(value)} см`] : [];
  });

  const isEmpty = sizes.length === 0 && params.length === 0;

  return (
    <article className={styles.card}>
      <div>
        <h3 className={styles.name}>{profile.name}</h3>
        <p className={styles.meta}>
          {genderLabel} · сітка {profile.system}
        </p>
      </div>

      {sizes.length > 0 && (
        <dl className={styles.sizes}>
          {sizes.map((item) => (
            <div key={item.label} className={styles.sizeItem}>
              <dt className={styles.sizeLabel}>{item.label}</dt>
              <dd className={styles.sizeValue}>{item.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {params.length > 0 && <p className={styles.params}>{params.join(" · ")}</p>}

      {isEmpty && <p className={styles.emptyText}>Розміри ще не вказані</p>}

      <div className={styles.actions}>
        <button type="button" className={styles.action} onClick={() => onEdit(profile)} disabled={disabled}>
          Редагувати
        </button>
        <button
          type="button"
          className={`${styles.action} ${styles.actionDanger}`}
          onClick={() => onRemove(profile)}
          disabled={disabled}
        >
          Видалити
        </button>
      </div>
    </article>
  );
}
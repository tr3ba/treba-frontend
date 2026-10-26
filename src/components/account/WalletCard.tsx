import type { SavedCard } from "../../types/wallet";
import styles from "./WalletCard.module.css";

type WalletCardProps = {
  card: SavedCard;
  /** Пока выполняется действие — кнопки неактивны */
  disabled?: boolean;
  onMakeDefault: (cardId: string) => void;
  onRemove: (card: SavedCard) => void;
};

const BRAND_LABEL: Record<SavedCard["brand"], string> = {
  visa: "VISA",
  mastercard: "Mastercard",
  other: "Картка",
};

// Збережена картка в розділі «Гаманець»: вигляд банківської картки + дії під нею
export default function WalletCard({ card, disabled = false, onMakeDefault, onRemove }: WalletCardProps) {
  const brandClass =
    card.brand === "visa" ? styles.visa : card.brand === "mastercard" ? styles.mastercard : styles.other;

  return (
    <article className={styles.item}>
      <div className={`${styles.card} ${brandClass}`}>
        <div className={styles.cardTop}>
          <span className={styles.chip} aria-hidden="true" />
          <span className={styles.brand}>{BRAND_LABEL[card.brand]}</span>
        </div>

        <p className={styles.number} aria-label={`Картка, останні цифри ${card.last4}`}>
          •••• •••• •••• {card.last4}
        </p>

        <div className={styles.cardBottom}>
          <span className={styles.holder}>{card.holder}</span>
          <span className={styles.expiry}>
            {card.expMonth}/{card.expYear}
          </span>
        </div>
      </div>

      <div className={styles.actions}>
        {card.isDefault ? (
          <span className={styles.defaultMark}>✓ Основна картка</span>
        ) : (
          <button
            type="button"
            className={styles.action}
            onClick={() => onMakeDefault(card.id)}
            disabled={disabled}
          >
            Зробити основною
          </button>
        )}

        <button
          type="button"
          className={`${styles.action} ${styles.actionDanger}`}
          onClick={() => onRemove(card)}
          disabled={disabled}
        >
          Видалити
        </button>
      </div>
    </article>
  );
}
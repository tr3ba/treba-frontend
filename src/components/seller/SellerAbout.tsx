import EmptyState from "../account/EmptyState";
import SellerRatingOverview from "./SellerRatingOverview";
import type { SellerProfile } from "../../types/seller";
import { formatPrice, formatSinceMonth, pluralize } from "../../lib/format";
import styles from "./SellerAbout.module.css";

type SellerAboutProps = {
  seller: SellerProfile;
};

// Вкладка «Про продавця»: слева описание, график, условия; справа рейтинг и показатели
export default function SellerAbout({ seller }: SellerAboutProps) {
  const { description, schedule, minOrderAmount, companyName, joinedAt, rating, stats } = seller;

  const hasInfo = Boolean(description || schedule?.length || minOrderAmount || companyName);
  const hasIndicators = Boolean(joinedAt || stats);

  if (!hasInfo && !rating && !hasIndicators) {
    return (
      <EmptyState
        icon="/icons/shop.svg"
        title="Інформації поки немає"
        subtitle="Продавець ще не розповів про себе. Подивіться його товари на сусідній вкладці."
      />
    );
  }

  return (
    <div className={styles.layout}>
      {hasInfo && (
        <aside className={styles.side}>
          {(description || companyName) && (
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Про продавця</h2>
              {description && <p className={styles.description}>{description}</p>}
              {companyName && (
                <p className={styles.company}>
                  <span className={styles.companyLabel}>Компанія</span>
                  {companyName}
                </p>
              )}
            </section>
          )}

          {schedule && schedule.length > 0 && (
            <section className={styles.card}>
              <h2 className={styles.cardTitle}>Графік роботи</h2>
              <dl className={styles.schedule}>
                {schedule.map((item) => (
                  <div key={item.days} className={styles.scheduleRow}>
                    <dt className={styles.scheduleDays}>{item.days}</dt>
                    <dd className={item.hours ? styles.scheduleHours : styles.scheduleOff}>
                      {item.hours ?? "Вихідний"}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {minOrderAmount ? (
            <section className={styles.notice}>
              <span className={styles.noticeLabel}>Мінімальна сума замовлення</span>
              <span className={styles.noticeValue}>{formatPrice(minOrderAmount)} ₴</span>
            </section>
          ) : null}
        </aside>
      )}

      <div className={styles.main}>
        {rating ? (
          <SellerRatingOverview rating={rating} />
        ) : (
          <section className={styles.noRating}>
            <h2 className={styles.cardTitle}>Рейтинг продавця</h2>
            <p className={styles.noRatingText}>
              Ще немає оцінок. Рейтинг з’явиться після перших відгуків покупців.
            </p>
          </section>
        )}

        {hasIndicators && (
          <ul className={styles.indicators} aria-label="Показники продавця">
            {joinedAt && (
              <li className={styles.indicator}>
                <span className={styles.indicatorLabel}>На TREBA</span>
                <span className={styles.indicatorValue}>з {formatSinceMonth(joinedAt)}</span>
              </li>
            )}
            {stats && (
              <>
                <li className={styles.indicator}>
                  <span className={styles.indicatorLabel}>Швидкість відправки</span>
                  <span className={styles.indicatorValue}>
                    у середньому {stats.shippingHours}{" "}
                    {pluralize(stats.shippingHours, ["година", "години", "годин"])}
                  </span>
                </li>
                <li className={styles.indicator}>
                  <span className={styles.indicatorLabel}>Швидкість доставки</span>
                  <span className={styles.indicatorValue}>
                    у середньому {stats.deliveryDays}{" "}
                    {pluralize(stats.deliveryDays, ["день", "дні", "днів"])}
                  </span>
                </li>
                <li className={styles.indicator}>
                  <span className={styles.indicatorLabel}>Скарги на замовлення</span>
                  <span className={styles.indicatorValue}>
                    {stats.complaintsPercent.toLocaleString("uk-UA")}%
                  </span>
                </li>
              </>
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import styles from "../../app/page.module.css";

const visionShort =
  "Ми віримо, що речі існують для того, щоб робити життя простішим, комфортнішим і приємнішим. Саме тому пошук тієї самої речі має бути швидким і легким. Ми не просто продаємо побутову техніку, електроніку, прикраси чи вино. Ми допомагаємо знайти саме те, що треба, в одному місці та без...";

const visionExtra =
  " зайвих зусиль. Наша команда щодня працює над тим, щоб кожне замовлення доїхало вчасно, а сервіс залишався простим і зрозумілим для кожного покупця — незалежно від міста чи досвіду онлайн-шопінгу.";

export default function FooterAbout() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className={styles.footerTextSection}>
      <div className={styles.footerTextInner}>
        <h2 className={styles.footerTitle}>TREBA</h2>
        <p className={styles.footerParagraph}>
          Провідний онлайн-маркетплейс в Україні. З моменту свого заснування ми втілюємо маленькі мрії та
          грандіозні плани мільйонів людей. На нашій платформі можна знайти буквально все. Ми пропонуємо
          товари за справедливою ціною та надаємо гарантію, адже переконані, що онлайн-шопінг має бути
          максимально зручним і безпечним. І щоразу, коли хтось натискає «Купити» на сайті TREBA, ми
          розуміємо, що робимо справді важливу справу.
        </p>

        <h3 className={styles.footerTitle}>Наше бачення</h3>
        <p className={styles.footerParagraph}>
          {isExpanded
            ? visionShort.replace(/\.\.\.$/, "") + visionExtra
            : visionShort}
        </p>

        <button
          className={styles.readMoreButton}
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
        >
          <span className={styles.readMoreText}>Читати повністю</span>
          <span
            className={`${styles.readMoreArrow} ${
              isExpanded ? styles.readMoreArrowOpen : ""
            }`}
          >
            ▾
          </span>
        </button>
      </div>
    </section>
  );
}
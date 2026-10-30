"use client";
import { useAdminI18n } from "@/features/admin/i18n/provider";
import Icon from "./Icon";
import styles from "./LanguageSelector.module.css";

export default function LanguageSelector() {
  const { language, setLanguage, t } = useAdminI18n();
  return (
    <div
      className={styles.selector}
      role="group"
      aria-label={t("Мова інтерфейсу")}
    >
      <Icon name="globe" size={17} />
      <button
        type="button"
        lang="uk"
        aria-label="Українська"
        aria-pressed={language === "uk"}
        onClick={() => setLanguage("uk")}
      >
        UK
      </button>
      <button
        type="button"
        lang="en"
        aria-label="English"
        aria-pressed={language === "en"}
        onClick={() => setLanguage("en")}
      >
        EN
      </button>
    </div>
  );
}

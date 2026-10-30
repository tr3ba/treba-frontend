"use client";
import { useAdminI18n } from "@/features/admin/i18n/provider";
import Icon from "./Icon";
import styles from "./LanguageSelector.module.css";

export default function LanguageSelector() {
  const { language, setLanguage, t } = useAdminI18n();
  return (
    <div
      className={styles.selector}
    >
      <Icon name="globe" size={17} />
      <select
        aria-label={t("Мова інтерфейсу")}
        value={language}
        onChange={(event) => setLanguage(event.target.value === "en" ? "en" : "uk")}
      >
        <option value="uk" lang="uk">Українська</option>
        <option value="en" lang="en">English</option>
      </select>
      <Icon name="chevron" size={14} />
    </div>
  );
}

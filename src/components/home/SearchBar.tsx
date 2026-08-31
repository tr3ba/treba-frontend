"use client";

import { useRef, useState } from "react";
import pageStyles from "../../app/page.module.css";
import styles from "./SearchBar.module.css";

const BLUR_DELAY = 150;

const popularQueries = [
  "навушники",
  "ssd",
  "macbook",
  "рюкзак шкільний",
  "конструктор lego",
  "кросівки",
  "мультиварка",
  "джинси",
  "парфуми",
  "велосипед",
  "зволожувач повітря",
  "ігрова клавіатура",
];

export default function SearchBar() {
  const [value, setValue] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openSuggestions = () => {
    if (blurTimer.current) {
      clearTimeout(blurTimer.current);
      blurTimer.current = null;
    }
    setIsOpen(true);
  };

  const closeSuggestions = () => {
    blurTimer.current = setTimeout(() => setIsOpen(false), BLUR_DELAY);
  };

  const pickQuery = (query: string) => {
    setValue(query);
    setIsOpen(false);
  };

  return (
    <div className={pageStyles.searchWrapper}>
      <div className={pageStyles.searchBox}>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={openSuggestions}
          onBlur={closeSuggestions}
          placeholder="Я шукаю..."
          className={styles.searchInput}
        />
        <img src="/icons/mic.svg" alt="" className={pageStyles.micIcon} />
      </div>

      <button type="button" className={pageStyles.searchButton}>
        Знайти
      </button>

      {isOpen && (
        <div
          className={styles.suggestions}
          onMouseDown={(e) => e.preventDefault()}
        >
          <p className={styles.suggestionsTitle}>Популярні запити</p>
          <div className={styles.suggestionsList}>
            {popularQueries.map((query) => (
              <button
                key={query}
                type="button"
                className={styles.suggestionPill}
                onClick={() => pickQuery(query)}
              >
                {query}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
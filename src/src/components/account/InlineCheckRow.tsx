"use client";

import { useState } from "react";
import styles from "./InlineCheckRow.module.css";

type InlineCheckRowProps = {
  placeholder: string;
  buttonLabel: string;
  onSubmit?: (value: string) => void;
};

export default function InlineCheckRow({
  placeholder,
  buttonLabel,
  onSubmit,
}: InlineCheckRowProps) {
  const [value, setValue] = useState("");

  return (
    <div className={styles.row}>
      <input
        type="text"
        className={styles.input}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button
        type="button"
        className={styles.button}
        disabled={!value.trim()}
        onClick={() => onSubmit?.(value.trim())}
      >
        {buttonLabel}
      </button>
    </div>
  );
}
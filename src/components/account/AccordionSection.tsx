"use client";

import { useState } from "react";
import styles from "./AccordionSection.module.css";

export type FieldOption = {
  value: string;
  label: string;
};

export type SectionField = {
  key: string;
  label: string;
  value: string;
  placeholder?: string;
  multiline?: boolean;

  type?: "text" | "radio" | "multiselect";
  options?: FieldOption[];
  mask?: "date";
};

function formatDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);
  return [day, month, year].filter(Boolean).join(".");
}

type AccordionSectionProps = {
  title: string;
  fields: SectionField[];
  onSave: (values: Record<string, string>) => void;
  defaultOpen?: boolean;
  emptyText?: string;
  readOnly?: boolean;
};

function formatDisplayValue(field: SectionField): string {
  if (field.type === "radio") {
    const match = field.options?.find((o) => o.value === field.value);
    return match ? match.label : field.value;
  }
  if (field.type === "multiselect") {
    const selected = field.value.split(",").map((v) => v.trim()).filter(Boolean);
    const labels = selected.map(
      (v) => field.options?.find((o) => o.value === v)?.label ?? v
    );
    return labels.join(", ");
  }
  return field.value;
}

// Універсальна картка розділу особистого кабінету
export default function AccordionSection({
  title,
  fields,
  onSave,
  defaultOpen = false,
  emptyText = "Ще не заповнено",
  readOnly = false,
}: AccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, f.value]))
  );

  const hasAnyValue = fields.some((f) => f.value.trim().length > 0);

  function startEditing() {
    setDraft(Object.fromEntries(fields.map((f) => [f.key, f.value])));
    setIsEditing(true);
    setIsOpen(true);
  }

  function cancelEditing() {
    setIsEditing(false);
  }

  function save() {
    onSave(draft);
    setIsEditing(false);
  }

  function toggleMultiselectValue(fieldKey: string, optionValue: string) {
    setDraft((prev) => {
      const current = (prev[fieldKey] ?? "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);
      const next = current.includes(optionValue)
        ? current.filter((v) => v !== optionValue)
        : [...current, optionValue];
      return { ...prev, [fieldKey]: next.join(",") };
    });
  }

  return (
    <section className={styles.card}>
      <button
        type="button"
        className={styles.header}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
      >
        <span className={styles.title}>{title}</span>
        <span className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ""}`}>
          <svg viewBox="0 0 16 16" width="16" height="16" fill="none">
            <path
              d="M4 6l4 4 4-4"
              stroke="#28251d"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div className={styles.body}>
          {isEditing ? (
            <>
              <div className={styles.fieldsGrid}>
                {fields.map((field) => {
                  const type = field.type ?? "text";
                  const selectedValues = (draft[field.key] ?? "")
                    .split(",")
                    .map((v) => v.trim())
                    .filter(Boolean);

                  return (
                    <div key={field.key} className={styles.fieldLabel}>
                      {field.label}

                      {type === "radio" && field.options && (
                        <div className={styles.optionsRow}>
                          {field.options.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              className={`${styles.optionPill} ${
                                draft[field.key] === opt.value ? styles.optionPillActive : ""
                              }`}
                              onClick={() =>
                                setDraft((prev) => ({ ...prev, [field.key]: opt.value }))
                              }
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {type === "multiselect" && field.options && (
                        <div className={styles.optionsRow}>
                          {field.options.map((opt) => (
                            <button
                              key={opt.value}
                              type="button"
                              className={`${styles.optionPill} ${
                                selectedValues.includes(opt.value) ? styles.optionPillActive : ""
                              }`}
                              onClick={() => toggleMultiselectValue(field.key, opt.value)}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {type === "text" && field.multiline && (
                        <textarea
                          className={styles.textarea}
                          value={draft[field.key] ?? ""}
                          placeholder={field.placeholder}
                          onChange={(e) =>
                            setDraft((prev) => ({ ...prev, [field.key]: e.target.value }))
                          }
                        />
                      )}

                      {type === "text" && !field.multiline && (
                        <input
                          type="text"
                          className={styles.input}
                          value={draft[field.key] ?? ""}
                          placeholder={field.placeholder}
                          inputMode={field.mask === "date" ? "numeric" : undefined}
                          onChange={(e) =>
                            setDraft((prev) => ({
                              ...prev,
                              [field.key]:
                                field.mask === "date"
                                  ? formatDateInput(e.target.value)
                                  : e.target.value,
                            }))
                          }
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className={styles.actionsRow}>
                <button type="button" className={styles.saveButton} onClick={save}>
                  Зберегти
                </button>
                <button
                  type="button"
                  className={styles.cancelButton}
                  onClick={cancelEditing}
                >
                  Скасувати
                </button>
              </div>
            </>
          ) : hasAnyValue ? (
            <>
              <div className={styles.valuesList}>
                {fields
                  .filter((f) => f.value.trim().length > 0)
                  .map((field) => (
                    <p key={field.key} className={styles.valueRow}>
                      {fields.length > 1 && (
                        <span className={styles.valueLabel}>{field.label}: </span>
                      )}
                      {formatDisplayValue(field)}
                    </p>
                  ))}
              </div>
              {!readOnly && (
                <button type="button" className={styles.editButton} onClick={startEditing}>
                  Редагувати
                </button>
              )}
            </>
          ) : (
            <>
              <p className={styles.emptyText}>{emptyText}</p>
              <button type="button" className={styles.editButton} onClick={startEditing}>
                Додати
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
"use client";

import { useState, type FormEvent } from "react";
import { GENDER_OPTIONS, MEASUREMENT_FIELDS, SIZE_CHARTS, SIZE_SYSTEMS } from "../../data/sizeCharts";
import type { BodyMeasurements, SizeGender, SizeProfile, SizeProfileInput, SizeSystem } from "../../types/sizes";
import styles from "./SizeProfileForm.module.css";

type SizeProfileFormProps = {
  /** Профиль для редактирования; без него — создание нового */
  initial?: SizeProfile;
  onSubmit: (input: SizeProfileInput) => Promise<void>;
  onCancel: () => void;
};

type MeasurementKey = keyof BodyMeasurements;
type MeasurementValues = Record<MeasurementKey, string>;

type FormErrors = {
  name?: string;
  measurements: Partial<Record<MeasurementKey, string>>;
};

const EMPTY_VALUES: MeasurementValues = { heightCm: "", chestCm: "", waistCm: "", hipsCm: "", footCm: "" };

// числа из профиля -> строки для полей (24.5 -> "24,5")
function toInputValues(measurements?: BodyMeasurements): MeasurementValues {
  const values = { ...EMPTY_VALUES };
  for (const field of MEASUREMENT_FIELDS) {
    const value = measurements?.[field.key];
    if (value !== undefined) values[field.key] = String(value).replace(".", ",");
  }
  return values;
}

// "24,5" -> 24.5; пустое поле -> undefined
function parseCm(value: string): number | undefined {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return Number(trimmed.replace(",", "."));
}

function validate(name: string, values: MeasurementValues): FormErrors {
  const errors: FormErrors = { measurements: {} };

  if (!name.trim()) {
    errors.name = "Вкажіть назву профілю";
  }

  for (const field of MEASUREMENT_FIELDS) {
    const value = parseCm(values[field.key]);
    if (value !== undefined && (Number.isNaN(value) || value < field.min || value > field.max)) {
      errors.measurements[field.key] = `Від ${field.min} до ${field.max} см`;
    }
  }

  return errors;
}

function hasErrors(errors: FormErrors): boolean {
  return Boolean(errors.name) || Object.keys(errors.measurements).length > 0;
}

// Форма профілю розмірів: назва, для кого, сітка, параметри в см, розміри
export default function SizeProfileForm({ initial, onSubmit, onCancel }: SizeProfileFormProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [gender, setGender] = useState<SizeGender>(initial?.gender ?? "female");
  const [system, setSystem] = useState<SizeSystem>(initial?.system ?? "EU");
  const [values, setValues] = useState<MeasurementValues>(() => toInputValues(initial?.measurements));
  const [topSize, setTopSize] = useState(initial?.topSize ?? "");
  const [bottomSize, setBottomSize] = useState(initial?.bottomSize ?? "");
  const [shoeSize, setShoeSize] = useState(initial?.shoeSize ?? "");

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const chart = SIZE_CHARTS[system];
  const errors: FormErrors = isSubmitted ? validate(name, values) : { measurements: {} };

  // другая сетка — размеры, которых в ней нет, сбрасываем
  function changeSystem(next: SizeSystem) {
    const nextChart = SIZE_CHARTS[next];
    setSystem(next);
    if (!nextChart.clothes.includes(topSize)) setTopSize("");
    if (!nextChart.clothes.includes(bottomSize)) setBottomSize("");
    if (!nextChart.shoes.includes(shoeSize)) setShoeSize("");
  }

  function changeMeasurement(key: MeasurementKey, raw: string) {
    // только цифры и один разделитель (точка или запятая)
    const cleaned = raw.replace(/[^\d.,]/g, "").slice(0, 5);
    setValues((prev) => ({ ...prev, [key]: cleaned }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitted(true);
    setSubmitError(null);

    if (hasErrors(validate(name, values))) return;

    const measurements: BodyMeasurements = {};
    for (const field of MEASUREMENT_FIELDS) {
      const value = parseCm(values[field.key]);
      if (value !== undefined) measurements[field.key] = Math.round(value * 10) / 10;
    }

    setIsSaving(true);
    try {
      await onSubmit({
        name: name.trim(),
        gender,
        system,
        measurements,
        topSize: topSize || undefined,
        bottomSize: bottomSize || undefined,
        shoeSize: shoeSize || undefined,
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Не вдалося зберегти профіль");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit} noValidate>
      <h2 className={styles.title}>{initial ? "Редагування профілю" : "Новий профіль"}</h2>

      {/* ---------- основное ---------- */}
      <label className={styles.field}>
        <span className={styles.label}>Назва профілю</span>
        <input
          className={`${styles.input} ${errors.name ? styles.inputError : ""}`}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Наприклад, «Для себе»"
          maxLength={30}
        />
        {errors.name && <span className={styles.error}>{errors.name}</span>}
      </label>

      <fieldset className={styles.fieldset}>
        <legend className={styles.label}>Для кого</legend>
        <div className={styles.segmented}>
          {GENDER_OPTIONS.map((option) => (
            <label
              key={option.id}
              className={`${styles.segment} ${gender === option.id ? styles.segmentActive : ""}`}
            >
              <input
                type="radio"
                name="size-gender"
                value={option.id}
                checked={gender === option.id}
                onChange={() => setGender(option.id)}
                className={styles.srOnly}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className={styles.fieldset}>
        <legend className={styles.label}>Розмірна сітка</legend>
        <div className={styles.segmented}>
          {SIZE_SYSTEMS.map((option) => (
            <label
              key={option.id}
              className={`${styles.segment} ${system === option.id ? styles.segmentActive : ""}`}
            >
              <input
                type="radio"
                name="size-system"
                value={option.id}
                checked={system === option.id}
                onChange={() => changeSystem(option.id)}
                className={styles.srOnly}
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      {/* ---------- параметры ---------- */}
      <div className={styles.group}>
        <h3 className={styles.groupTitle}>Параметри, см</h3>
        <div className={styles.measureGrid}>
          {MEASUREMENT_FIELDS.map((field) => (
            <label key={field.key} className={styles.field}>
              <span className={styles.label}>{field.label}</span>
              <input
                className={`${styles.input} ${errors.measurements[field.key] ? styles.inputError : ""}`}
                value={values[field.key]}
                onChange={(event) => changeMeasurement(field.key, event.target.value)}
                inputMode="decimal"
                placeholder={field.placeholder}
              />
              {errors.measurements[field.key] && (
                <span className={styles.error}>{errors.measurements[field.key]}</span>
              )}
            </label>
          ))}
        </div>
      </div>

      {/* ---------- размеры ---------- */}
      <div className={styles.group}>
        <h3 className={styles.groupTitle}>Розміри ({system})</h3>
        <div className={styles.sizeGrid}>
          <label className={styles.field}>
            <span className={styles.label}>Верх</span>
            <select className={styles.select} value={topSize} onChange={(event) => setTopSize(event.target.value)}>
              <option value="">—</option>
              {chart.clothes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Низ</span>
            <select
              className={styles.select}
              value={bottomSize}
              onChange={(event) => setBottomSize(event.target.value)}
            >
              <option value="">—</option>
              {chart.clothes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>

          <label className={styles.field}>
            <span className={styles.label}>Взуття</span>
            <select className={styles.select} value={shoeSize} onChange={(event) => setShoeSize(event.target.value)}>
              <option value="">—</option>
              {chart.shoes.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {submitError && (
        <p className={styles.submitError} role="alert">
          {submitError}
        </p>
      )}

      <div className={styles.buttons}>
        <button type="submit" className={styles.saveButton} disabled={isSaving}>
          {isSaving ? "Збереження…" : "Зберегти профіль"}
        </button>
        <button type="button" className={styles.cancelButton} onClick={onCancel} disabled={isSaving}>
          Скасувати
        </button>
      </div>
    </form>
  );
}
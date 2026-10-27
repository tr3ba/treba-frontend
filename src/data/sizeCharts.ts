// Розмірні сітки та довідники для розділу «Розміри».
// Щоб додати нову сітку (напр. UA) — додайте її в SizeSystem, SIZE_SYSTEMS і SIZE_CHARTS.

import type { BodyMeasurements, SizeGender, SizeSystem } from "../types/sizes";

function range(from: number, to: number, step: number): string[] {
  const values: string[] = [];
  for (let value = from; value <= to; value += step) {
    values.push(String(value));
  }
  return values;
}

export const SIZE_SYSTEMS: { id: SizeSystem; label: string }[] = [
  { id: "EU", label: "Європейська (EU)" },
  { id: "US", label: "Американська (US)" },
];

export const SIZE_CHARTS: Record<SizeSystem, { clothes: string[]; shoes: string[] }> = {
  EU: {
    clothes: range(32, 56, 2),
    shoes: range(35, 47, 1),
  },
  US: {
    clothes: ["XS", "S", "M", "L", "XL", "XXL", "3XL"],
    shoes: range(5, 14, 0.5),
  },
};

export const GENDER_OPTIONS: { id: SizeGender; label: string }[] = [
  { id: "female", label: "Жіночий" },
  { id: "male", label: "Чоловічий" },
];

export const MEASUREMENT_FIELDS: {
  key: keyof BodyMeasurements;
  label: string;
  /** Коротка назва для картки профілю */
  short: string;
  placeholder: string;
  min: number;
  max: number;
}[] = [
  { key: "heightCm", label: "Зріст", short: "Зріст", placeholder: "170", min: 50, max: 250 },
  { key: "chestCm", label: "Обхват грудей", short: "Груди", placeholder: "90", min: 40, max: 200 },
  { key: "waistCm", label: "Обхват талії", short: "Талія", placeholder: "70", min: 40, max: 200 },
  { key: "hipsCm", label: "Обхват стегон", short: "Стегна", placeholder: "96", min: 40, max: 200 },
  { key: "footCm", label: "Довжина стопи", short: "Стопа", placeholder: "24,5", min: 10, max: 35 },
];
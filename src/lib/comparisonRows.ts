// Рядки таблиці порівняння з даних товарів.
// Спершу загальні поля (продавець, бренд, країна, гарантія), потім характеристики —
// об'єднання за назвою, у порядку першої появи. Рядки, де значень немає ні в кого, пропускаємо.

import type { ComparisonCardProduct, ComparisonRow } from "../types/comparison";
import { parsePrice, pluralize } from "./format";

const MONTH_FORMS: [string, string, string] = ["місяць", "місяці", "місяців"];

type BaseField = {
  key: string;
  label: string;
  get: (product: ComparisonCardProduct) => string | undefined;
};

const BASE_FIELDS: BaseField[] = [
  { key: "seller", label: "Продавець", get: (p) => p.seller?.name },
  { key: "brand", label: "Бренд", get: (p) => p.brand },
  { key: "country", label: "Країна-виробник", get: (p) => p.countryOfOrigin },
  {
    key: "warranty",
    label: "Гарантія",
    get: (p) =>
      p.warrantyMonths ? `${p.warrantyMonths} ${pluralize(p.warrantyMonths, MONTH_FORMS)}` : undefined,
  },
];

function normalize(value: string | null): string {
  return (value ?? "").trim().toLowerCase();
}

function makeRow(key: string, label: string, values: (string | null)[]): ComparisonRow | null {
  if (values.every((value) => value === null)) return null;
  const first = normalize(values[0]);
  return { key, label, values, isSame: values.every((value) => normalize(value) === first) };
}

export function buildComparisonRows(products: ComparisonCardProduct[]): ComparisonRow[] {
  const rows: ComparisonRow[] = [];

  for (const field of BASE_FIELDS) {
    const row = makeRow(
      field.key,
      field.label,
      products.map((product) => field.get(product)?.trim() || null)
    );
    if (row) rows.push(row);
  }

  // Назви характеристик у порядку першої появи
  const labels: string[] = [];
  for (const product of products) {
    for (const characteristic of product.characteristics ?? []) {
      if (!labels.includes(characteristic.label)) labels.push(characteristic.label);
    }
  }

  for (const label of labels) {
    const values = products.map(
      (product) =>
        product.characteristics?.find((item) => item.label === label)?.value.trim() || null
    );
    const row = makeRow(`spec:${label}`, label, values);
    if (row) rows.push(row);
  }

  return rows;
}

/** id товару з найнижчою ціною; null — якщо ціни однакові або товар один. */
export function getCheapestProductId(products: ComparisonCardProduct[]): string | null {
  if (products.length < 2) return null;
  const prices = products.map((product) => parsePrice(product.price));
  const min = Math.min(...prices);
  if (prices.every((price) => price === min)) return null;
  return products[prices.indexOf(min)].id;
}
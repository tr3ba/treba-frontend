// Перетворює рядок ціни ("12 999", "1 090,50") на число
export function parsePrice(price: string | null | undefined): number {
  if (!price) return 0;
  const value = Number(price.replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(value) ? value : 0;
}

// 12999 -> "12 999"
export function formatPrice(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

// Відмінювання: pluralize(3, ["товар", "товари", "товарів"]) -> "товари"
export function pluralize(count: number, forms: [string, string, string]): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}
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

const dateFormatter = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

const dateTimeFormatter = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

const monthGenitiveFormatter = new Intl.DateTimeFormat("uk-UA", {
  day: "numeric",
  month: "long",
});

// "2026-10-15" -> "15 жовтня 2026 р."
export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

// "2026-10-15T08:12:00" -> "15 жовтня о 08:12"
export function formatDateTime(iso: string): string {
  return dateTimeFormatter.format(new Date(iso));
}

// "2024-10-08" -> "жовтня 2024" (для «На TREBA з жовтня 2024»)
export function formatSinceMonth(iso: string): string {
  const date = new Date(iso);
  // Месяц в родительном падеже бывает только вместе с днём — день потом отбрасываем
  const month = monthGenitiveFormatter.formatToParts(date).find((part) => part.type === "month")?.value ?? "";
  return `${month} ${date.getFullYear()}`;
}
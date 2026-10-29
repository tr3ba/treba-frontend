// Convert a calendar filter to midnight in the panel's existing display timezone.
// The upper bound is exclusive, so selecting a final date includes that entire day.
export function adminDateBoundary(value: string, end = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const [year, month, day] = value.split("-").map(Number);
  const wall = Date.UTC(year, month - 1, day + (end ? 1 : 0));
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Vilnius",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(wall));
  const get = (key: string) =>
    Number(parts.find((p) => p.type === key)?.value ?? 0);
  const local = Date.UTC(
    get("year"),
    get("month") - 1,
    get("day"),
    get("hour"),
    get("minute"),
    get("second"),
  );
  return new Date(wall - (local - wall)).toISOString();
}

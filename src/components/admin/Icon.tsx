import type { CSSProperties } from "react";
const paths: Record<string, string> = {
  grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
  box: "m12 3 9 5-9 5-9-5 9-5Z M3 8v9l9 5 9-5V8 M12 13v9 M7.5 5.5l9 5",
  bag: "M5 7h14l2 14H3L5 7Z M8 7V5a4 4 0 0 1 8 0v2",
  shield: "m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z m-4 9 3 3 5-6",
  layers: "m12 3 10 5-10 5L2 8l10-5Z M2 12l10 5 10-5 M2 16l10 5 10-5",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M16 3a4 4 0 0 1 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  shop: "M3 10v11h18V10 M2 10l3-7h14l3 7 M2 10c0 4 5 4 5 0 0 4 5 4 5 0 0 4 5 4 5 0 0 4 5 4 5 0 M9 21v-7h6v7",
  star: "m12 3 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1 3-6Z",
  chat: "M21 11a9 9 0 0 1-9 9H3l1.5-4.5A9 9 0 1 1 21 11Z M8 10h8 M8 14h5",
  gift: "M3 8h18v4H3z M5 12v9h14v-9 M12 8v13 M12 8H7a3 3 0 1 1 3-3l2 3Z M12 8h5a3 3 0 1 0-3-3l-2 3Z",
  settings:
    "m9 3-1 3-3 1-2 4 2 2v3l3 2 1 3h6l1-3 3-2v-3l2-2-2-4-3-1-1-3H9Z M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  bell: "M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9 M10 21h4",
  search: "M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z m-2 5 7 7",
  plus: "M12 5v14 M5 12h14",
  close: "m6 6 12 12 M6 18 18 6",
  arrow: "M4 12h16 m-6-6 6 6-6 6",
  chevron: "m9 5 7 7-7 7",
  check: "m5 12 4 4L19 6",
  trash: "M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7",
  refresh: "M20 7A9 9 0 1 0 21 15 M20 2v5h-5",
  upload: "M12 16V3 m-5 5 5-5 5 5 M3 16v5h18v-5",
  logout: "M9 3H3v18h6 M9 12h12 m-5-5 5 5-5 5",
  menu: "M3 6h18 M3 12h18 M3 18h18",
  edit: "m16 3 5 5-12 12-6 1 1-6L16 3Z M13 6l5 5",
  clock: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z M12 7v5l3 2",
  chart: "M4 3v18h18 M8 16l4-5 4 2 5-7",
  image: "M3 3h18v18H3z m0 15 6-7 5 6 3-4 4 5 M8 7h.01",
};
export default function Icon({
  name,
  size = 20,
  style,
}: {
  name: string;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      <path d={paths[name] ?? paths.grid} />
    </svg>
  );
}

import type { Category } from "./types";
export function visibleCategories(
  rows: Category[],
  expanded: ReadonlySet<string>,
  search: string,
) {
  const term = search.trim().toLocaleLowerCase("uk");
  const matches = (row: Category): boolean =>
    row.name.toLocaleLowerCase("uk").includes(term) ||
    (row.children ?? []).some(matches);
  const result: (Category & { depth: number })[] = [];
  function visit(items: Category[], depth: number) {
    for (const row of items) {
      if (term && !matches(row)) continue;
      result.push({ ...row, depth });
      if (term || expanded.has(row.id)) visit(row.children ?? [], depth + 1);
    }
  }
  visit(rows, 0);
  return result;
}

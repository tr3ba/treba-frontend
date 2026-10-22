export type CatalogQuery = { q: string; page: number; sort: string; brandId?: string; minPrice?: number; maxPrice?: number; stock?: string; attributes: Record<string, string> };
export type SearchValues = Record<string, string | string[] | undefined>;
const guid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function readCatalogQuery(values: SearchValues): CatalogQuery {
  const read = (key: string) => typeof values[key] === "string" ? values[key] as string : "";
  const price = (key: string) => { const raw = read(key); if (!raw) return undefined; if (!/^\d{1,12}(\.\d{1,2})?$/.test(raw)) throw new Error("Ціна має бути невід’ємним числом."); return Number(raw); };
  const minPrice = price("minPrice"), maxPrice = price("maxPrice");
  if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) throw new Error("Мінімальна ціна перевищує максимальну.");
  const attributes: Record<string, string> = {};
  for (const [key, value] of Object.entries(values)) if (key.startsWith("attribute_") && guid.test(key.slice(10)) && typeof value === "string" && value.length > 0 && value.length <= 200) attributes[key.slice(10)] = value;
  if (Object.keys(attributes).length > 20) throw new Error("Оберіть до 20 характеристик.");
  const rawPage = Number(read("page") || "1");
  const sort = read("sort");
  return { q: read("q").trim().slice(0, 200), page: Number.isInteger(rawPage) && rawPage >= 1 && rawPage <= 100000 ? rawPage : 1,
    sort: ["priceasc", "pricedesc", "nameasc", "oldest"].includes(sort) ? sort : "newest", brandId: guid.test(read("brandId")) ? read("brandId") : undefined,
    minPrice, maxPrice, stock: read("stock") === "available" ? "available" : undefined, attributes };
}
export function catalogHref(path: string, query: CatalogQuery, page: number): string {
  const values = new URLSearchParams();
  if (query.q) values.set("q", query.q);
  values.set("page", String(page)); values.set("sort", query.sort);
  for (const key of ["brandId", "minPrice", "maxPrice", "stock"] as const) if (query[key] !== undefined) values.set(key, String(query[key]));
  for (const [id, value] of Object.entries(query.attributes)) values.set("attribute_" + id, value);
  return path + "?" + values;
}

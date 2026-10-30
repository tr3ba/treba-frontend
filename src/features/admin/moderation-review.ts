import type { Attribute, AttributeDefinition, Paged } from "./types";

/** View/navigation choices never change the pending-only API query. */
export function moderationQuery(params: URLSearchParams) {
  const query = new URLSearchParams();
  for (const key of ["page", "size", "search", "categoryId", "brandId", "sellerId", "waitingHours", "sort"]) {
    const value = params.get(key);
    if (value) query.set(key, value);
  }
  query.set("status", "PENDING_MODERATION");
  if (!query.has("sort")) query.set("sort", "waiting");
  return query;
}

export function reviewIndex(items: readonly { id: string }[], requested: string | null) {
  if (!items.length) return -1;
  if (requested === "last") return items.length - 1;
  return Math.max(0, items.findIndex(item => item.id === requested));
}

export function reviewNeighbor(data: Paged<{ id: string }>, index: number, direction: -1 | 1) {
  const neighbor = data.content[index + direction];
  if (neighbor) return { page: data.page, item: neighbor.id };
  const page = data.page + direction;
  return page >= 1 && page <= data.totalPages ? { page, item: direction === -1 ? "last" : null } : null;
}

export function removeReviewedProduct<T extends { id: string }>(data: Paged<T> | null, id: string): Paged<T> | null {
  if (!data || !data.content.some(item => item.id === id)) return data;
  const totalElements = Math.max(0, data.totalElements - 1);
  return {
    ...data,
    content: data.content.filter(item => item.id !== id),
    totalElements,
    totalPages: Math.ceil(totalElements / Math.max(1, data.size)),
  };
}

export function groupReviewAttributes(values: Attribute[]) {
  const groups = new Map<string, { attributeId: string; variantId?: string | null; values: Attribute[] }>();
  for (const value of values) {
    const key = `${value.attributeId}/${value.variantId ?? ""}`;
    const group = groups.get(key) ?? { attributeId: value.attributeId, variantId: value.variantId, values: [] };
    group.values.push(value);
    groups.set(key, group);
  }
  return [...groups.values()];
}

export function reviewAttributeValue(value: Attribute, definition?: AttributeDefinition): string | number | boolean | null {
  if (value.optionId) return definition?.options.find(option => option.id === value.optionId)?.name ?? value.optionId;
  return value.stringValue ?? value.numberValue ?? value.boolValue ?? null;
}

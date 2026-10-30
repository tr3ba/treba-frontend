import type { Message } from "./types";

// Only queue filters belong in API requests; the selected conversation stays in the URL.
export function supportQuery(params: URLSearchParams, trash = false) {
  const query = new URLSearchParams();
  for (const key of trash ? ["search", "page"] : ["search", "page", "status", "kind", "view", "orderId", "productId"]) {
    const value = params.get(key);
    if (value) query.set(key, value);
  }
  return query;
}

export function supportHref(params: URLSearchParams, changes: Record<string, string | null>, trash = false) {
  const query = new URLSearchParams(params);
  for (const [key, value] of Object.entries(changes)) {
    if (value) query.set(key, value);
    else query.delete(key);
  }
  return `/admin/support${trash ? "/trash" : ""}${query.size ? "?" + query : ""}`;
}

export function supportStatusEvent(text: string) {
  const match = /^(OPEN|IN_PROGRESS|APPROVED|REJECTED|CLOSED) → (OPEN|IN_PROGRESS|APPROVED|REJECTED|CLOSED)$/.exec(text);
  return match ? [match[1], match[2]] as const : null;
}

export function mergeSupportMessages(older: Message[], latest: Message[]) {
  const byId = new Map([...older, ...latest].map(message => [message.id, message]));
  return [...byId.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}

import type { Paged, Review, ReviewReplyTemplate } from "./types";

export const reviewStatuses = ["PENDING", "PUBLISHED", "REJECTED", "ALL"] as const;
export function reviewStatus(params: URLSearchParams) {
  const value = params.get("status")?.toUpperCase() ?? "PENDING";
  return reviewStatuses.includes(value as typeof reviewStatuses[number]) ? value : value === "" ? "ALL" : "PENDING";
}
export function reviewsQuery(params: URLSearchParams) {
  const query = new URLSearchParams();
  for (const key of ["page", "size", "search"]) if (params.get(key)) query.set(key, params.get(key)!);
  const status = reviewStatus(params);
  if (status !== "ALL") query.set("status", status);
  return query;
}
export function renderReviewReply(template: ReviewReplyTemplate, language: "uk" | "en", review: Pick<Review, "authorName" | "productName">) {
  const text = language === "en" ? template.textEn : template.textUk;
  const customer = review.authorName.trim().split(/\s+/)[0] ?? "";
  // A single pass keeps braces inside customer/product names as ordinary text.
  return text.replace(/\{(customer|product)\}/g, (_, name: string) => name === "customer" ? customer : review.productName);
}
export function applyReviewDecision(data: Paged<Review> | null, id: string, status: string, reply: string | undefined, filter: string): Paged<Review> | null {
  if (!data || !data.content.some(review => review.id === id)) return data;
  const content = data.content.map(review => review.id === id ? { ...review, status, ...(reply !== undefined ? { staffReply: reply.trim() || null, staffRepliedAt: reply.trim() ? new Date().toISOString() : null } : {}) } : review);
  const visible = filter === "ALL" ? content : content.filter(review => review.status === filter);
  const totalElements = Math.max(0, data.totalElements - (content.length - visible.length));
  return { ...data, content: visible, totalElements, totalPages: Math.ceil(totalElements / Math.max(1, data.size)) };
}

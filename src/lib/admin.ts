import { getSafeNextPath } from "./redirect";

export const adminOrigin = (process.env.NEXT_PUBLIC_ADMIN_URL ?? "https://admin.treba.duckdns.org").replace(/\/+$/, "");
export function canOpenAdmin(role?: string) {
  return !!role && ["Administrator", "Manager", "Moderator", "Seller"].includes(role);
}

export function canApplyAsSeller(role?: string) {
  return role === "Customer";
}

export function workspaceLabel(role?: string) {
  return role === "Seller" ? "Кабінет продавця" : "Адмін-панель";
}

export function roleLabel(role?: string) {
  const labels: Record<string, string> = {
    Administrator: "Адміністратор", Manager: "Менеджер", Moderator: "Модератор",
    Seller: "Продавець", Customer: "Покупець",
  };
  return role ? labels[role] : undefined;
}

/** Called only after password/second-factor authentication has returned a user. */
export function getLoginDestination(role?: string, next?: string | null): string | null {
  const path = getSafeNextPath(next);
  if (!canOpenAdmin(role)) return next ? path : null;

  // Complete an existing admin handoff instead of restarting it and replacing its state cookie.
  const target = new URL(path, "https://treba.invalid");
  if (target.pathname === "/shop-api/admin-entry" && /^[A-F0-9]{64}$/.test(target.searchParams.get("state") ?? "")) return path;
  return adminOrigin + "/site-login/start";
}

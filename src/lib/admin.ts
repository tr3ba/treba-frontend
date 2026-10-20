export const adminOrigin = (process.env.NEXT_PUBLIC_ADMIN_URL ?? "https://admin.treba.duckdns.org").replace(/\/+$/, "");
export function canOpenAdmin(role?: string) {
  return !!role && ["Administrator", "Manager", "Moderator", "Seller"].includes(role);
}

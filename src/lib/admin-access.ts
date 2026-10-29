import { canOpenAdmin } from "./admin";
export function canAccessAdmin(role: string | undefined, path: string) {
  if (!canOpenAdmin(role)) return false;
  const route = path.replace(/^\/admin/, "").replace(/\/$/, "") || "/";
  if (["/", "/profile", "/notifications"].includes(route)) return true;
  if (route === "/products/import") return role === "Seller";
  if (route === "/support/trash") return ["Administrator", "Manager"].includes(role!);
  if (/^\/(users|settings)(\/|$)/.test(route)) return role === "Administrator";
  if (route === "/sellers/new") return role === "Administrator";
  if (/^\/(categories|sellers|customer-activity|loyalty)(\/|$)/.test(route)) return ["Administrator", "Manager"].includes(role!);
  if (["/moderation", "/reviews"].includes(route)) return role !== "Seller";
  if (/^\/products(?:\/new|\/[^/]+\/edit)$/.test(route)) return role !== "Moderator";
  if (route === "/products") return true;
  if (/^\/orders(\/|$)/.test(route)) return role !== "Moderator";
  return /^\/support(\/|$)/.test(route);
}

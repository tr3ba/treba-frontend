import { adminOrigin } from "./admin";
import { getSafeNextPath } from "./redirect";
export function notificationHref(item: { scope: string; path: string }): string {
  const path = getSafeNextPath(item.path, "/account/notifications");
  return item.scope === "admin" ? adminOrigin + "/site-login/start?returnUrl=" + encodeURIComponent(path) : path;
}

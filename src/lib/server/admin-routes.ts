// The browser chooses a workspace resource, never a backend URL. API authorization remains authoritative.
const id = "[0-9a-fA-F-]{36}";
const rules: [string, RegExp, string][] = [
  ["GET", /^session$/, "/api/users/me"],
  ["GET|PATCH", /^profile$/, "/api/users/me"],
  ["POST|DELETE", /^profile\/avatar$/, "/api/users/me/avatar"],
  ["GET", /^dashboard$/, "/api/v1/admin/dashboard"],
  [
    "GET",
    /^operations\/(metrics|customers)(?:\/[0-9a-fA-F-]{36})?$/,
    "/api/v1/admin/",
  ],
  ["GET|POST", /^catalog\/(products|attributes|duplicates)$/, "/api/v1/admin/"],
  [
    "GET",
    /^catalog\/(stats|filter-options|categories|brands|stores|moderation\/pending-count)$/,
    "/api/v1/admin/",
  ],
  ["GET|PUT|DELETE", new RegExp(`^catalog/products/${id}$`), "/api/v1/admin/"],
  [
    "GET",
    new RegExp(
      `^catalog/products/${id}/(moderation-history|resubmission-changes)$`,
    ),
    "/api/v1/admin/",
  ],
  ["POST", /^catalog\/bulk\/(preview|apply)$/, "/api/v1/admin/"],
  ["POST", new RegExp(`^products/${id}/(approve|reject)$`), "/api/v1/admin/"],
  ["POST", new RegExp(`^products/${id}/submit$`), "/api/v1/seller/"],
  ["GET|POST", new RegExp(`^products/${id}/images(?:/upload)?$`), "/api/v1/"],
  ["DELETE", new RegExp(`^products/${id}/images/${id}$`), "/api/v1/"],
  [
    "GET|POST",
    /^(orders|promotions|sellers|users|seller-applications)$/,
    "/api/v1/admin/",
  ],
  [
    "GET|PUT",
    new RegExp(`^(orders|promotions|sellers|users)/${id}$`),
    "/api/v1/admin/",
  ],
  ["PATCH", new RegExp(`^orders/${id}/status$`), "/api/v1/admin/"],
  [
    "POST",
    new RegExp(
      `^(sellers/${id}/(approve|suspend)|users/${id}/(block|unblock)|seller-applications/${id}/review)$`,
    ),
    "/api/v1/admin/",
  ],
  ["GET", /^reviews(?:\/pending-count)?$/, "/api/v1/admin/"],
  ["PUT", new RegExp(`^reviews/${id}/moderate$`), "/api/v1/admin/"],
  ["GET|POST", /^categories$/, "/api/v1/"],
  ["PATCH", new RegExp(`^categories/${id}$`), "/api/v1/"],
  ["POST", new RegExp(`^categories/${id}/move$`), "/api/v1/"],
  ["GET|POST", /^support$/, "/api/v1/"],
  ["GET", /^support\/(capabilities|deleted)$/, "/api/v1/"],
  ["GET|DELETE", new RegExp(`^support/${id}$`), "/api/v1/"],
  ["GET|POST", new RegExp(`^support/${id}/messages$`), "/api/v1/"],
  ["POST", new RegExp(`^support/${id}/(read|restore)$`), "/api/v1/"],
  ["PATCH", new RegExp(`^support/${id}/status$`), "/api/v1/"],
  ["GET|POST", /^settings\/staff$/, "/api/v1/admin/"],
  ["GET", /^settings\/(audit|features)$/, "/api/v1/admin/"],
  [
    "PUT",
    new RegExp(
      `^settings/(staff/${id}/access|features/support.chat-deletion)$`,
    ),
    "/api/v1/admin/",
  ],
  [
    "GET|PUT",
    new RegExp(`^telegram/(mappings|sellers/${id}/categories)$`),
    "/api/v1/admin/",
  ],
  ["GET", /^imports\/(options|queue)$/, "/api/v1/seller/"],
  [
    "POST",
    new RegExp(
      `^imports/(queue|queue/${id}/retry|${id}/(brand|category|submit))$`,
    ),
    "/api/v1/seller/",
  ],
  ["GET", new RegExp(`^imports/${id}$`), "/api/v1/seller/"],
  ["PUT", new RegExp(`^imports/${id}/category$`), "/api/v1/seller/"],
  ["GET", /^security$/, "/api/"],
  [
    "POST",
    /^security\/(authenticator\/(setup|confirm|disable)|email\/(setup|confirm|disable\/start|disable\/confirm))$/,
    "/api/",
  ],
  ["GET|POST|DELETE", /^telegram-account\/link$/, "/api/telegram/link"],
  ["POST", /^telegram-account\/link\/confirm$/, "/api/telegram/link/confirm"],
  ["GET", /^notifications$/, "/api/v1/account/notifications"],
  ["POST", /^notifications\/read$/, "/api/v1/account/notifications/read"],
];
export function adminBackendPath(method: string, path: string): string | null {
  if (path.includes("..") || /[%\\?#]/.test(path)) return null;
  for (const [methods, pattern, target] of rules)
    if (methods.split("|").includes(method) && pattern.test(path))
      return target.endsWith("/") ? target + path : target;
  return null;
}

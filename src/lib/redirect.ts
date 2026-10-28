// Адрес возврата после входа/регистрации (?next=...).
// Пропускаем только внутренние пути, чтобы ссылкой нельзя было увести на чужой сайт.

export function getSafeNextPath(value: string | null | undefined, fallback = "/"): string {
  if (!value || value.length > 2048 || !value.startsWith("/") || value.startsWith("//") || /[\\\u0000-\u0020]/.test(value)) return fallback;
  try {
    const url = new URL(value, "https://treba.invalid");
    const path = decodeURIComponent(url.pathname);
    if (url.origin !== "https://treba.invalid" || /[\\\u0000-\u0020]/.test(path) || path.startsWith("//") || /^\/(login|register)(\/|$)/i.test(path) || /^\/(shop-api|api\/auth)\/external(\/|$)/i.test(path)) return fallback;
    return url.pathname + url.search + url.hash;
  } catch { return fallback; }
}

/** Ссылка на вход/регистрацию с возвратом на next */
export function buildAuthHref(path: "/login" | "/register", next?: string): string {
  return next ? `${path}?next=${encodeURIComponent(getSafeNextPath(next))}` : path;
}

/** A retained account background must never redirect an already open auth modal. */
export function getAccountLoginHref(path: string): string | null {
  const next = getSafeNextPath(path);
  if (!/^\/(account|seller)(\/|\?|#|$)/.test(next)) return null;
  return buildAuthHref("/login", next);
}

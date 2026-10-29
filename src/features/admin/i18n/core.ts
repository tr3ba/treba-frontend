import english from "./en.json";

export type AdminLanguage = "uk" | "en";
export type MessageKey = keyof typeof english;
export const languageCookie = "treba_workspace_language";
export const normalizeLanguage = (value?: string | null): AdminLanguage =>
  value?.toLowerCase().startsWith("en") ? "en" : "uk";

const translations: Record<string, string> = english;
const ukrainian = Object.fromEntries(
  Object.entries(english).map(([uk, en]) => [en, uk]),
);

/** Marks a translation key used in a static navigation or column definition. */
export const message = (value: MessageKey) => value;

export function translate(
  language: AdminLanguage,
  key: string,
  values: readonly unknown[] = [],
) {
  const source = Object.hasOwn(translations, key)
    ? key
    : (ukrainian[key] ?? key);
  const text = language === "en" ? (translations[source] ?? key) : source;
  return text.replace(/\{(\d+)\}/g, (token, index: string) =>
    Number(index) < values.length ? String(values[Number(index)] ?? "") : token,
  );
}

export function formatMoney(
  language: AdminLanguage,
  value: number,
  currency = "UAH",
) {
  return new Intl.NumberFormat(language === "en" ? "en-GB" : "uk-UA", {
    style: "currency",
    currency,
  }).format(value);
}

export function formatDate(language: AdminLanguage, value?: string) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (!Number.isFinite(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat(language === "en" ? "en-GB" : "uk-UA", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Vilnius",
  }).format(parsed);
}

export const statusMessages: Record<string, string> = {
  ACTIVE: "Активний",
  PENDING_MODERATION: "На модерації",
  PENDING: "На перевірці",
  DRAFT: "Чернетка",
  REJECTED: "Відхилено",
  PUBLISHED: "Опубліковано",
  APPROVED: "Схвалено",
  SUSPENDED: "Призупинено",
  BLOCKED: "Заблоковано",
  OPEN: "Відкрито",
  IN_PROGRESS: "В роботі",
  CLOSED: "Закрито",
  AWAITING_PAYMENT: "Очікує оплати",
  CREATED: "Створено",
  PAID: "Оплачено",
  CONFIRMED: "Підтверджено",
  PROCESSING: "Обробляється",
  READY_FOR_SHIPMENT: "Готове до відправлення",
  SHIPPED: "Відправлено",
  DELIVERED: "Доставлено",
  COMPLETED: "Завершено",
  CANCELLED: "Скасовано",
  RETURN_REQUESTED: "Запит повернення",
  RETURNED: "Повернуто",
  SCHEDULED: "Заплановано",
  FINISHED: "Завершено",
  CHAT: "Чат",
  QUESTION: "Питання",
  RETURN: "Повернення",
  QUEUED: "У черзі",
  FAILED: "Помилка",
  READY: "Готово",
  RUNNING: "Обробляється",
  ADMINISTRATOR: "Адміністратор",
  MANAGER: "Менеджер",
  MODERATOR: "Модератор",
  SELLER: "Продавець",
  CUSTOMER: "Покупець",
  PRODUCT: "Товари",
  REVIEW: "Відгуки",
  USER: "Користувачі",
  ORDER: "Замовлення",
  PERCENTAGE: "Відсоткова",
  FIXED_AMOUNT: "Фіксована сума",
};
export function translateStatus(language: AdminLanguage, value: string) {
  return translate(language, statusMessages[value.toUpperCase()] ?? value);
}

export function translateError(language: AdminLanguage, error: string) {
  if (!error) return "";
  const translated = translate(language, error);
  return language === "en" && /[\u0400-\u04ff]/.test(translated)
    ? translate(language, "Не вдалося виконати запит.")
    : translated;
}

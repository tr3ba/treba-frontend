// Гаманець (збережені картки). Эндпоинта на бэке нет — храним в браузере (localStorage),
// отдельно для каждого пользователя. Когда бэк появится — меняется только этот файл.
// Полный номер карты и CVV НЕ сохраняем: только бренд, последние 4 цифры, имя и срок.
// Только для клиентских компонентов.

import type { CardBrand, NewCardInput, SavedCard } from "../../types/wallet";

const STORAGE_PREFIX = "treba_wallet_";
const FAKE_DELAY_MS = 250;

function wait(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, FAKE_DELAY_MS));
}

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

// crypto.randomUUID недоступен по http в локальной сети (тест с телефона) — делаем id сами
function createId(): string {
  return `card_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function isCardBrand(value: unknown): value is CardBrand {
  return value === "visa" || value === "mastercard" || value === "other";
}

function isSavedCard(value: unknown): value is SavedCard {
  if (typeof value !== "object" || value === null) return false;
  const card = value as Record<string, unknown>;
  return (
    typeof card.id === "string" &&
    isCardBrand(card.brand) &&
    typeof card.last4 === "string" &&
    typeof card.holder === "string" &&
    typeof card.expMonth === "string" &&
    typeof card.expYear === "string" &&
    typeof card.isDefault === "boolean"
  );
}

function readCards(userId: string): SavedCard[] {
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isSavedCard) : [];
  } catch {
    // пошкоджені дані — порожній гаманець
    return [];
  }
}

function writeCards(userId: string, cards: SavedCard[]): void {
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(cards));
  } catch {
    throw new Error("Не вдалося зберегти зміни. Спробуйте ще раз.");
  }
}

/** Платіжна система за першими цифрами номера */
export function detectCardBrand(digits: string): CardBrand {
  if (/^4/.test(digits)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "mastercard";
  return "other";
}

/** Усі збережені картки користувача */
export async function getSavedCards(userId: string): Promise<SavedCard[]> {
  await wait();
  return readCards(userId);
}

/** Додати картку. Перша картка стає основною. Повертає оновлений список. */
export async function addSavedCard(userId: string, input: NewCardInput): Promise<SavedCard[]> {
  await wait();
  const cards = readCards(userId);
  const digits = input.number.replace(/\D/g, "");
  const last4 = digits.slice(-4);

  const isDuplicate = cards.some(
    (card) => card.last4 === last4 && card.expMonth === input.expMonth && card.expYear === input.expYear
  );
  if (isDuplicate) {
    throw new Error("Ця картка вже збережена");
  }

  const card: SavedCard = {
    id: createId(),
    brand: detectCardBrand(digits),
    last4,
    holder: input.holder.trim().toUpperCase(),
    expMonth: input.expMonth,
    expYear: input.expYear,
    isDefault: cards.length === 0,
    createdAt: new Date().toISOString(),
  };

  const next = [...cards, card];
  writeCards(userId, next);
  return next;
}

/** Видалити картку. Якщо видалили основну — основною стає перша з решти. */
export async function removeSavedCard(userId: string, cardId: string): Promise<SavedCard[]> {
  await wait();
  const cards = readCards(userId);
  let next = cards.filter((card) => card.id !== cardId);

  if (next.length > 0 && !next.some((card) => card.isDefault)) {
    next = next.map((card, index) => ({ ...card, isDefault: index === 0 }));
  }

  writeCards(userId, next);
  return next;
}

/** Зробити картку основною */
export async function setDefaultCard(userId: string, cardId: string): Promise<SavedCard[]> {
  await wait();
  const next = readCards(userId).map((card) => ({ ...card, isDefault: card.id === cardId }));
  writeCards(userId, next);
  return next;
}
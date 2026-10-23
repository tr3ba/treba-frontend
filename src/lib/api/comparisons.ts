// API порівняння товарів. Тільки для клієнтських компонентів.
// На бэку ендпоінтів порівняння поки немає — списки зберігаємо в localStorage,
// окремо для кожного користувача. Коли бэк з'явиться: замінити тіла функцій нижче
// на запити через прокси /shop-api/comparisons. Сигнатури та типи лишаються —
// контекст і компоненти переписувати не доведеться.

import type {
  ComparisonItem,
  ComparisonList,
  ComparisonProduct,
} from "../../types/comparison";

/** Максимум товарів в одному списку — більше таблиця стає нечитабельною. */
export const MAX_COMPARISON_ITEMS = 6;

const STORAGE_PREFIX = "treba_comparisons:";
const FAKE_DELAY_MS = 150;
/** Товар без категорії — у спільний список */
const OTHER_LIST_ID = "other";
const OTHER_LIST_TITLE = "Інші товари";

/** Помилка порівняння. message — готовий текст для UI (укр.). */
export class ComparisonError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ComparisonError";
  }
}

/** id списку, до якого потрапить товар. */
export function getComparisonListId(product: ComparisonProduct): string {
  return product.subcategoryId ?? product.categoryId ?? OTHER_LIST_ID;
}

// ---------- localStorage (тимчасово, замість бэку) ----------

function storageKey(userId: string): string {
  return STORAGE_PREFIX + userId;
}

function isComparisonItem(value: unknown): value is ComparisonItem {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return typeof item.productKey === "string" && typeof item.addedAt === "string";
}

function isComparisonList(value: unknown): value is ComparisonList {
  if (typeof value !== "object" || value === null) return false;
  const list = value as Record<string, unknown>;
  return (
    typeof list.id === "string" &&
    typeof list.title === "string" &&
    typeof list.updatedAt === "string" &&
    Array.isArray(list.items)
  );
}

function byNewest(a: ComparisonList, b: ComparisonList): number {
  return b.updatedAt.localeCompare(a.updatedAt);
}

function readLists(userId: string): ComparisonList[] {
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(isComparisonList)
      .map((list) => ({ ...list, items: list.items.filter(isComparisonItem) }))
      .filter((list) => list.items.length > 0)
      .sort(byNewest);
  } catch {
    // пошкоджені дані або localStorage недоступний — порожньо
    return [];
  }
}

function writeLists(userId: string, lists: ComparisonList[]): void {
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(lists));
  } catch {
    throw new ComparisonError("Не вдалося зберегти порівняння. Спробуйте ще раз.");
  }
}

function fakeDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, FAKE_DELAY_MS));
}

// ---------- Публічні функції (API-ready) ----------

/** Усі списки користувача, нові зверху. */
export async function getComparisonLists(userId: string): Promise<ComparisonList[]> {
  await fakeDelay();
  return readLists(userId);
}

/** Додати товар у список його категорії. Повертає оновлені списки. */
export async function addToComparison(
  userId: string,
  product: ComparisonProduct
): Promise<ComparisonList[]> {
  await fakeDelay();
  const lists = readLists(userId);
  const listId = getComparisonListId(product);
  const now = new Date().toISOString();
  const existing = lists.find((list) => list.id === listId);

  if (existing?.items.some((item) => item.productKey === product.id)) return lists;

  if (existing && existing.items.length >= MAX_COMPARISON_ITEMS) {
    throw new ComparisonError(
      `У списку «${existing.title}» уже ${MAX_COMPARISON_ITEMS} товарів. Приберіть один, щоб додати новий.`
    );
  }

  const item: ComparisonItem = { productKey: product.id, addedAt: now };
  const updated: ComparisonList = existing
    ? { ...existing, items: [...existing.items, item], updatedAt: now }
    : {
        id: listId,
        title: product.subcategoryName ?? OTHER_LIST_TITLE,
        catalogCategoryId: product.categoryId,
        items: [item],
        updatedAt: now,
      };

  const next = [updated, ...lists.filter((list) => list.id !== listId)].sort(byNewest);
  writeLists(userId, next);
  return next;
}

/** Прибрати товар з порівняння. Порожній список видаляється. */
export async function removeFromComparison(
  userId: string,
  productKey: string
): Promise<ComparisonList[]> {
  await fakeDelay();
  const next = readLists(userId)
    .map((list) =>
      list.items.some((item) => item.productKey === productKey)
        ? {
            ...list,
            items: list.items.filter((item) => item.productKey !== productKey),
            updatedAt: new Date().toISOString(),
          }
        : list
    )
    .filter((list) => list.items.length > 0)
    .sort(byNewest);
  writeLists(userId, next);
  return next;
}

/** Видалити список повністю. */
export async function deleteComparisonList(
  userId: string,
  listId: string
): Promise<ComparisonList[]> {
  await fakeDelay();
  const next = readLists(userId).filter((list) => list.id !== listId);
  writeLists(userId, next);
  return next;
}
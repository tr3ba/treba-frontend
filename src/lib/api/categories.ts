import { Category, categories } from "../../data/categories";

const FAKE_DELAY_MS = 300;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), FAKE_DELAY_MS));
}

export async function getCategories(): Promise<Category[]> {
  return delay(categories);
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const found = categories.find((category) => category.id === id) ?? null;
  return delay(found);
}
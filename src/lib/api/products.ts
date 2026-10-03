import { Product } from "../../types/product";
import { bestOffersProducts, recommendedProducts } from "../../data/products";


const FAKE_DELAY_MS = 300;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), FAKE_DELAY_MS));
}


export async function getBestOffersProducts(): Promise<Product[]> {
  return delay(bestOffersProducts);
}

export async function getRecommendedProducts(): Promise<Product[]> {
  return delay(recommendedProducts);
}


export async function getProductById(id: string): Promise<Product | null> {
  const all = [...bestOffersProducts, ...recommendedProducts];
  const found = all.find((p) => p.id === id) ?? null;
  return delay(found);
}

export async function getRelatedProducts(excludeId: string, limit = 6): Promise<Product[]> {
  const all = [...bestOffersProducts, ...recommendedProducts];
  const related = all.filter((p) => p.id !== excludeId).slice(0, limit);
  return delay(related);
}

export async function getSponsoredProducts(excludeId: string, limit = 6): Promise<Product[]> {
  const all = [...bestOffersProducts, ...recommendedProducts];
  const sponsored = all.filter((p) => p.id !== excludeId).slice(-limit).reverse();
  return delay(sponsored);
}

export async function getProductsByCategory(categoryId: string, limit = 12): Promise<Product[]> {
  const all = [...bestOffersProducts, ...recommendedProducts];
  const inCategory = all.filter((p) => p.categoryId === categoryId);
  const result = inCategory.length > 0 ? inCategory : all;
  return delay(result.slice(0, limit));
}

export async function getViewedProducts(excludeId: string, limit = 6): Promise<Product[]> {
  const all = [...bestOffersProducts, ...recommendedProducts];
  const shuffled = all.filter((p) => p.id !== excludeId).sort(() => Math.random() - 0.5);
  return delay(shuffled.slice(0, limit));
}
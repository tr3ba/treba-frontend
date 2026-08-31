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
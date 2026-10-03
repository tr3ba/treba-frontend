import { Review } from "../../types/review";
import { sampleReviews } from "../../data/reviews";

const FAKE_DELAY_MS = 300;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), FAKE_DELAY_MS));
}

export async function getProductReviews(_productId: string): Promise<Review[]> {
  return delay(sampleReviews);
}
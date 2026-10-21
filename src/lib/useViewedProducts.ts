import { useSyncExternalStore } from "react";
import { getViewedServerSnapshot, getViewedSnapshot, subscribeViewed } from "./api/viewed";
import type { ViewedProduct } from "../types/viewed";

// История просмотров без setState в эффекте (как useMediaQuery).
// До гидрации — пустой список, потом — данные из браузера.
export function useViewedProducts(): ViewedProduct[] {
  return useSyncExternalStore(subscribeViewed, getViewedSnapshot, getViewedServerSnapshot);
}
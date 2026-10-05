"use client";

import { createContext, useContext, ReactNode } from "react";
import type { Category } from "../types/category";

// Категории загружаются один раз на сервере (в app/layout.tsx)
// и раздаются клиентским компонентам (меню каталога и т.д.) через контекст.
// Так меню работает на всех страницах, включая кабинет, без запросов из браузера.

const CategoriesContext = createContext<Category[] | undefined>(undefined);

type CategoriesProviderProps = {
  categories: Category[];
  children: ReactNode;
};

export function CategoriesProvider({ categories, children }: CategoriesProviderProps) {
  return <CategoriesContext.Provider value={categories}>{children}</CategoriesContext.Provider>;
}

export function useCategories(): Category[] {
  const ctx = useContext(CategoriesContext);
  if (!ctx) {
    throw new Error("useCategories должен использоваться внутри CategoriesProvider");
  }
  return ctx;
}
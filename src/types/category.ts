// Категорія каталогу (верхній рівень меню).
// Колонки subcategories — підрозділи 2-го рівня, items — назви 3-го рівня.

export type SubcategoryColumn = {
  title: string;
  id?: string;
  itemLinks?: { id: string; label: string }[];
  image?: string;
  items: string[];
};

export type Category = {
  id: string; // slug, наприклад "laptops"
  label: string;
  backendId?: string;
  path?: { id: string; label: string }[];
  icon: string;
  description?: string;
  subcategories?: SubcategoryColumn[];
};
// Категорія каталогу (верхній рівень меню).
// Колонки subcategories — підрозділи 2-го рівня, items — назви 3-го рівня.

export type SubcategoryColumn = {
  title: string;
  image?: string;
  items: string[];
};

export type Category = {
  id: string; // slug, наприклад "laptops"
  label: string;
  icon: string;
  description?: string;
  subcategories?: SubcategoryColumn[];
};
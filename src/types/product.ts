// Характеристика товару
export type ProductCharacteristic = {
  label: string;
  value: string;
};

// Варіант товару 
export type ProductVariant = {
  id: string;
  label: string; 
  image: string;
  colorHex?: string;
  available: boolean;
};

// Продавець / бренд товару
export type Seller = {
  id: string;
  name: string;
  logo?: string;
};

// Супутній товар-аксесуар 
export type ProductAccessory = {
  id: string;
  title: string;
  image: string;
  price: string;
  oldPrice?: string | null;
};

// Додаткова послуга 
export type ProductService = {
  id: string;
  title: string;
  description: string;
  price: string;
};

export type Product = {
  id: string;
  title: string;
  price: string;
  oldPrice?: string | null;
  image?: string;
  rating?: number;
  isPromo?: boolean;
  categoryId?: string;
  inStock?: boolean;

  // Поля
  code?: string;
  reviewsCount?: number;
  images?: string[];
  seller?: Seller;
  characteristics?: ProductCharacteristic[];
  variants?: ProductVariant[];
  accessories?: ProductAccessory[];
  services?: ProductService[];
};
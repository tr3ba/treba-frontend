import type { NextConfig } from "next";

// Картинки товаров приходят с бэка: <адрес бэка>/uploads/products/...
// Прод-домен прописан явно: next start читает этот файл заново при запуске контейнера,
// а там переменной NEXT_PUBLIC_API_URL может не быть.
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

const imageOrigins = new Set([
  apiUrl,
  "https://treba.duckdns.org", // прод (AWS, через Caddy)
  "http://localhost:5000", // локальный бэк в Docker
]);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [...imageOrigins].map((origin) => new URL("/uploads/**", origin)),
    // Next 16 по умолчанию не оптимизирует картинки с localhost — разрешаем только в разработке
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
  },
};

export default nextConfig;
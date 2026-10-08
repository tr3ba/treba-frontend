import type { NextConfig } from "next";

// Картинки товаров приходят с бэка (например http://localhost:5000/uploads/products/...).
// Разрешаем next/image загружать их с адреса из NEXT_PUBLIC_API_URL.
const apiUrl = new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: apiUrl.protocol === "https:" ? "https" : "http",
        hostname: apiUrl.hostname,
        port: apiUrl.port,
        pathname: "/uploads/**",
      },
    ],
    // Локально бэк работает на localhost, а Next 16 по умолчанию не оптимизирует
    // картинки с локальных адресов. Разрешаем это только в режиме разработки.
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production",
  },
};

export default nextConfig;
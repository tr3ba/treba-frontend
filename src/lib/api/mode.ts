// Источник данных: моки или реальный backend.
// Управляется переменной NEXT_PUBLIC_USE_MOCKS в .env.local ("true" — моки).
// Если переменная не задана — работаем с бэком (так безопаснее для продакшена).
export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
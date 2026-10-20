// Mock-данные продавцов (магазинов). Рейтинга, отзывов, графика работы и показателей
// сервиса на бэке пока нет — когда появятся, заменим в lib/api/sellers.ts.

import type { SellerProfile, SellerReview } from "../types/seller";

export const mockSellers: SellerProfile[] = [
  {
    id: "technodim",
    name: "ТехноДім",
    companyName: "ТОВ «ТехноДім Україна»",
    description:
      "Офіційний партнер виробників побутової техніки та електроніки. Працюємо з 2018 року, відправляємо замовлення з власного складу в Києві. Усі товари з офіційною гарантією виробника, допомагаємо з підбором і консультуємо до та після покупки.",
    joinedAt: "2024-10-08",
    minOrderAmount: 500,
    schedule: [
      { days: "Пн–Пт", hours: "09:00–18:00" },
      { days: "Сб", hours: "09:00–15:00" },
      { days: "Нд", hours: null },
    ],
    stats: { shippingHours: 10, deliveryDays: 4, complaintsPercent: 0.3 },
    rating: {
      average: 4.8,
      count: 412,
      byPeriod: {
        "30d": { average: 4.9, count: 38, distribution: { 5: 35, 4: 2, 3: 1, 2: 0, 1: 0 } },
        "6m": { average: 4.8, count: 195, distribution: { 5: 174, 4: 11, 3: 2, 2: 0, 1: 8 } },
        all: { average: 4.8, count: 412, distribution: { 5: 361, 4: 30, 3: 7, 2: 3, 1: 11 } },
      },
      criteria: {
        service: { "30d": 4.9, "6m": 4.7, all: 4.8 },
        delivery: { "30d": 4.9, "6m": 4.7, all: 4.8 },
        accuracy: { "30d": 5, "6m": 4.8, all: 4.8 },
      },
    },
  },
  {
    id: "chystodim",
    name: "ЧистоДім",
    companyName: "ФОП Литвиненко О. В.",
    description:
      "Побутова хімія, засоби для догляду та товари для дому за чесними цінами. Відправляємо щодня, крім неділі.",
    joinedAt: "2025-03-14",
    minOrderAmount: 200,
    schedule: [
      { days: "Пн–Сб", hours: "08:00–20:00" },
      { days: "Нд", hours: null },
    ],
    stats: { shippingHours: 6, deliveryDays: 2, complaintsPercent: 0.1 },
    rating: {
      average: 4.6,
      count: 87,
      byPeriod: {
        "30d": { average: 4.7, count: 12, distribution: { 5: 9, 4: 3, 3: 0, 2: 0, 1: 0 } },
        "6m": { average: 4.6, count: 54, distribution: { 5: 40, 4: 9, 3: 3, 2: 1, 1: 1 } },
        all: { average: 4.6, count: 87, distribution: { 5: 64, 4: 14, 3: 5, 2: 2, 1: 2 } },
      },
      criteria: {
        service: { "30d": 4.8, "6m": 4.6, all: 4.6 },
        delivery: { "30d": 4.7, "6m": 4.7, all: 4.7 },
        accuracy: { "30d": 4.6, "6m": 4.5, all: 4.5 },
      },
    },
  },
  {
    id: "zatyshok",
    name: "Затишок",
    companyName: "ФОП Мельник І. П.",
    description: "Меблі для дачі та товари для дітей. Новий магазин на TREBA.",
    joinedAt: "2026-09-01",
    schedule: [{ days: "Пн–Пт", hours: "10:00–19:00" }],
  },
];

/**
 * Какие mock-товары продаёт каждый продавец и в какой они категории.
 * В data/products.ts категорий нет — чтобы не переписывать тот файл,
 * связи храним здесь, а lib/api дописывает их к товарам.
 */
export const mockSellerProducts: Record<string, { productId: string; categoryId: string }[]> = {
  technodim: [
    { productId: "1", categoryId: "appliances" },
    { productId: "5", categoryId: "appliances" },
    { productId: "9", categoryId: "appliances" },
    { productId: "10", categoryId: "appliances" },
    { productId: "15", categoryId: "appliances" },
    { productId: "12", categoryId: "laptops" },
    { productId: "13", categoryId: "gaming" },
    { productId: "14", categoryId: "electronics" },
    { productId: "16", categoryId: "electronics" },
    { productId: "17", categoryId: "electronics" },
  ],
  chystodim: [
    { productId: "2", categoryId: "home" },
    { productId: "3", categoryId: "home" },
    { productId: "4", categoryId: "plumbing" },
    { productId: "7", categoryId: "beauty" },
    { productId: "11", categoryId: "drinks" },
  ],
  zatyshok: [
    { productId: "6", categoryId: "garden" },
    { productId: "8", categoryId: "kids" },
  ],
};

export const mockSellerReviews: Record<string, SellerReview[]> = {
  technodim: [
    {
      id: "sr-1",
      author: "Сергій К*** Анатолійович",
      date: "2026-10-15T10:24:00",
      scores: { service: 5, delivery: 5, accuracy: 5 },
      text: "Упаковка ціла, товар без пошкоджень. Відправили в той самий день, наступного ранку вже забрав у відділенні.",
    },
    {
      id: "sr-2",
      author: "Сергій К*** Миколайович",
      date: "2026-10-12T18:05:00",
      scores: { service: 5, delivery: 4, accuracy: 5 },
    },
    {
      id: "sr-3",
      author: "Олександр С*** Анатолійович",
      date: "2026-10-12T09:41:00",
      scores: { service: 5, delivery: 5, accuracy: 5 },
      text: "Менеджер допоміг обрати модель під мою кімнату, все чітко і без нав'язування.",
    },
    {
      id: "sr-4",
      author: "Іван Г*** Ярославович",
      date: "2026-10-12T08:15:00",
      scores: { service: 4, delivery: 5, accuracy: 5 },
    },
    {
      id: "sr-5",
      author: "Лілія А*** Анатоліївна",
      date: "2026-10-10T14:30:00",
      scores: { service: 3, delivery: 2, accuracy: 4 },
      text: "Відправка затрималась на два дні, довелось нагадувати. Сам товар хороший.",
      reply: {
        text: "Лілія, вибачте за затримку — того тижня на складі була інвентаризація. Дякуємо, що дочекались!",
        date: "2026-10-10T17:02:00",
      },
    },
    {
      id: "sr-6",
      author: "Марина П*** Олегівна",
      date: "2026-10-08T11:12:00",
      scores: { service: 5, delivery: 5, accuracy: 5 },
      text: "Другий раз купую тут, все супер.",
    },
    {
      id: "sr-7",
      author: "Андрій Т*** Васильович",
      date: "2026-10-03T19:47:00",
      scores: { service: 1, delivery: 3, accuracy: 2 },
      text: "На сайті товар був у наявності, а після оплати сказали чекати тиждень.",
      reply: {
        text: "Андрію, перепрошуємо: залишки на складі оновились із запізненням. Кошти повернули того ж дня.",
        date: "2026-10-04T09:20:00",
      },
    },
    {
      id: "sr-8",
      author: "Наталія Б*** Ігорівна",
      date: "2026-09-27T13:00:00",
      scores: { service: 5, delivery: 5, accuracy: 4 },
    },
  ],
  chystodim: [
    {
      id: "sr-9",
      author: "Оксана Д*** Петрівна",
      date: "2026-10-14T16:20:00",
      scores: { service: 5, delivery: 5, accuracy: 5 },
      text: "Швидко і акуратно запаковано, нічого не протекло.",
    },
    {
      id: "sr-10",
      author: "Віктор Л*** Сергійович",
      date: "2026-10-01T10:05:00",
      scores: { service: 4, delivery: 5, accuracy: 4 },
    },
  ],
  zatyshok: [],
};
// Гаманець: збережені банківські картки (поки mock — зберігаються в браузері)

export type CardBrand = "visa" | "mastercard" | "other";

/** Збережена картка. Повний номер і CVV не зберігаємо — лише останні 4 цифри. */
export type SavedCard = {
  id: string;
  brand: CardBrand;
  last4: string;
  /** Ім'я власника латиницею, як на картці */
  holder: string;
  /** Місяць: "01".."12" */
  expMonth: string;
  /** Дві останні цифри року: "28" */
  expYear: string;
  isDefault: boolean;
  createdAt: string;
};

/** Дані з форми «Додати картку». CVV сюди навмисно не входить. */
export type NewCardInput = {
  /** Тільки цифри */
  number: string;
  holder: string;
  expMonth: string;
  expYear: string;
};
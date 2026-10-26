// Подарункові сертифікати TREBA (поки mock — зберігаються в браузері)

export type GiftCertificate = {
  id: string;
  /** Код вигляду TRB-7KQ2-M9XA */
  code: string;
  /** Номінал у гривнях */
  amount: number;
  recipientName?: string;
  message?: string;
  purchasedAt: string;
  validUntil: string;
};

/** Дані з форми покупки */
export type CertificatePurchaseInput = {
  amount: number;
  recipientName?: string;
  message?: string;
};
// Заявка на подключение продавца (форма на /sell).
// Статусы — как SellerStatus на бэке (PENDING, ACTIVE, ...).

export type SellerApplicationStatus = "pending" | "approved" | "rejected";

export type WebsiteProtocol = "https://" | "http://";

export type SellerApplicationRequest = {
  companyName: string;
  storeName: string;
  taxNumber: string;
  /** Полный адрес сайта с протоколом или null, если сайта нет */
  website: string | null;
  /** ПІБ контактного лица */
  contactName: string;
  position: string;
  email: string;
  phone: string;
  /** Телефон не в украинском формате +380 */
  isNonResident: boolean;
};

export type SellerApplication = SellerApplicationRequest & {
  id: string;
  status: SellerApplicationStatus;
  /** ISO-дата подачи */
  createdAt: string;
  updatedAt: string;
  version: string;
  reviewNote?: string;
};

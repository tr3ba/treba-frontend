// Розділ «Розміри»: профілі з параметрами та розмірами одягу/взуття (поки mock)

export type SizeSystem = "EU" | "US";

export type SizeGender = "female" | "male";

/** Параметри тіла в сантиметрах; усі необов'язкові */
export type BodyMeasurements = {
  heightCm?: number;
  chestCm?: number;
  waistCm?: number;
  hipsCm?: number;
  footCm?: number;
};

export type SizeProfile = {
  id: string;
  /** Назва профілю: «Для себе», «Донька»… */
  name: string;
  gender: SizeGender;
  system: SizeSystem;
  measurements: BodyMeasurements;
  topSize?: string;
  bottomSize?: string;
  shoeSize?: string;
  updatedAt: string;
};

/** Дані з форми (створення або редагування) */
export type SizeProfileInput = Omit<SizeProfile, "id" | "updatedAt">;
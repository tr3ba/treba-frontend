// Подарункові сертифікати. Эндпоинта на бэке нет — храним в браузере (localStorage),
// отдельно для каждого пользователя. Покупка — демо, без оплаты.
// Когда бэк появится — покупка пойдёт через корзину/оформление, меняется этот файл.
// Только для клиентских компонентов.

import type { CertificatePurchaseInput, GiftCertificate } from "../../types/certificate";

/** Номінали-плитки у формі */
export const CERTIFICATE_PRESETS = [100, 250, 500, 1000, 2500, 5000];
/** Межі для «Інша сума» */
export const CERTIFICATE_MIN_AMOUNT = 100;
export const CERTIFICATE_MAX_AMOUNT = 50000;
/** Скільки місяців діє сертифікат */
const VALID_MONTHS = 12;

const STORAGE_PREFIX = "treba_certificates_";
const FAKE_DELAY_MS = 300;
// без похожих символов (0/O, 1/I/L), чтобы код было легко продиктовать
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function wait(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, FAKE_DELAY_MS));
}

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

// crypto.randomUUID недоступен по http в локальной сети — делаем id сами
function createId(): string {
  return `cert_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function randomChunk(length: number): string {
  let chunk = "";
  for (let i = 0; i < length; i += 1) {
    chunk += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return chunk;
}

function generateCode(existing: Set<string>): string {
  let code = "";
  do {
    code = `TRB-${randomChunk(4)}-${randomChunk(4)}`;
  } while (existing.has(code));
  return code;
}

/** " trb-7kq2 m9xa " -> "TRB-7KQ2M9XA" -> сравниваем без дефисов и пробелов */
function normalizeCode(code: string): string {
  return code.toUpperCase().replace(/[\s-]/g, "");
}

function isGiftCertificate(value: unknown): value is GiftCertificate {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return (
    typeof item.id === "string" &&
    typeof item.code === "string" &&
    typeof item.amount === "number" &&
    typeof item.purchasedAt === "string" &&
    typeof item.validUntil === "string"
  );
}

function readCertificates(userId: string): GiftCertificate[] {
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isGiftCertificate) : [];
  } catch {
    return [];
  }
}

function writeCertificates(userId: string, list: GiftCertificate[]): void {
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(list));
  } catch {
    throw new Error("Не вдалося зберегти сертифікат. Спробуйте ще раз.");
  }
}

/** Чи минув термін дії */
export function isCertificateExpired(certificate: GiftCertificate): boolean {
  return new Date(certificate.validUntil).getTime() < Date.now();
}

/** Сертифікати користувача, нові зверху */
export async function getCertificates(userId: string): Promise<GiftCertificate[]> {
  await wait();
  return readCertificates(userId).sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt));
}

/** Демо-покупка: створює сертифікат і повертає його разом з оновленим списком */
export async function buyCertificate(
  userId: string,
  input: CertificatePurchaseInput
): Promise<{ certificate: GiftCertificate; list: GiftCertificate[] }> {
  await wait();

  const amount = Math.round(input.amount);
  if (!Number.isFinite(amount) || amount < CERTIFICATE_MIN_AMOUNT || amount > CERTIFICATE_MAX_AMOUNT) {
    throw new Error(`Сума має бути від ${CERTIFICATE_MIN_AMOUNT} до ${CERTIFICATE_MAX_AMOUNT} ₴`);
  }

  const list = readCertificates(userId);
  const purchasedAt = new Date();
  const validUntil = new Date(purchasedAt);
  validUntil.setMonth(validUntil.getMonth() + VALID_MONTHS);

  const certificate: GiftCertificate = {
    id: createId(),
    code: generateCode(new Set(list.map((item) => item.code))),
    amount,
    recipientName: input.recipientName?.trim() || undefined,
    message: input.message?.trim() || undefined,
    purchasedAt: purchasedAt.toISOString(),
    validUntil: validUntil.toISOString(),
  };

  const next = [certificate, ...list];
  writeCertificates(userId, next);
  return { certificate, list: next };
}

/** Перевірка коду: шукаємо серед сертифікатів користувача. null — не знайдено. */
export async function checkCertificateCode(userId: string, code: string): Promise<GiftCertificate | null> {
  await wait();
  const target = normalizeCode(code);
  return readCertificates(userId).find((item) => normalizeCode(item.code) === target) ?? null;
}
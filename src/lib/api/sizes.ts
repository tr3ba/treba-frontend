// Профілі розмірів. Эндпоинта на бэке нет — храним в браузере (localStorage),
// отдельно для каждого пользователя. Когда бэк появится — меняется только этот файл.
// Только для клиентских компонентов.

import type { SizeProfile, SizeProfileInput } from "../../types/sizes";

const STORAGE_PREFIX = "treba_sizes_";
const FAKE_DELAY_MS = 250;

function wait(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, FAKE_DELAY_MS));
}

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}${userId}`;
}

// crypto.randomUUID недоступен по http в локальной сети — делаем id сами
function createId(): string {
  return `size_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function isSizeProfile(value: unknown): value is SizeProfile {
  if (typeof value !== "object" || value === null) return false;
  const profile = value as Record<string, unknown>;
  return (
    typeof profile.id === "string" &&
    typeof profile.name === "string" &&
    (profile.gender === "female" || profile.gender === "male") &&
    (profile.system === "EU" || profile.system === "US") &&
    typeof profile.measurements === "object" &&
    profile.measurements !== null
  );
}

function readProfiles(userId: string): SizeProfile[] {
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter(isSizeProfile) : [];
  } catch {
    return [];
  }
}

function writeProfiles(userId: string, profiles: SizeProfile[]): void {
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(profiles));
  } catch {
    throw new Error("Не вдалося зберегти профіль. Спробуйте ще раз.");
  }
}

/** Усі профілі розмірів користувача */
export async function getSizeProfiles(userId: string): Promise<SizeProfile[]> {
  await wait();
  return readProfiles(userId);
}

/** Створити профіль (без profileId) або оновити існуючий. Повертає оновлений список. */
export async function saveSizeProfile(
  userId: string,
  input: SizeProfileInput,
  profileId?: string
): Promise<SizeProfile[]> {
  await wait();
  const profiles = readProfiles(userId);
  const updatedAt = new Date().toISOString();

  const next = profileId
    ? profiles.map((profile) => (profile.id === profileId ? { ...input, id: profileId, updatedAt } : profile))
    : [...profiles, { ...input, id: createId(), updatedAt }];

  writeProfiles(userId, next);
  return next;
}

/** Видалити профіль */
export async function removeSizeProfile(userId: string, profileId: string): Promise<SizeProfile[]> {
  await wait();
  const next = readProfiles(userId).filter((profile) => profile.id !== profileId);
  writeProfiles(userId, next);
  return next;
}
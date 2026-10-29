import type { Product } from "./types";
export type EditorDraft = { model: Product; files: File[] };
async function database() {
  return await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("treba-admin-drafts", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("editors");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
export async function loadDraft(key: string): Promise<EditorDraft | null> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const request = db.transaction("editors").objectStore("editors").get(key);
      request.onsuccess = () => resolve(request.result ?? null);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}
export async function saveDraft(key: string, value: EditorDraft | null) {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("editors", "readwrite");
      if (value) tx.objectStore("editors").put(value, key);
      else tx.objectStore("editors").delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

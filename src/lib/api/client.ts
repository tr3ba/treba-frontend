// Базовый HTTP-клиент для backend API.
// Все функции в src/lib/api/* ходят в бэк только через apiFetch.

import type { ApiErrorBody } from "../../types/api";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000").replace(/\/+$/, "");

type QueryValue = string | number | boolean | null | undefined;

export type ApiRequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Record<string, QueryValue>;
  body?: unknown;
  token?: string | null;
  signal?: AbortSignal;
  /** Кэш Next для серверных запросов, в секундах. Не задано — без кэша. */
  revalidate?: number;
};

/** Ошибка запроса к API. message — уже готовый текст для UI (укр.). */
export class ApiError extends Error {
  readonly status: number;
  readonly body: ApiErrorBody | null;

  constructor(status: number, message: string, body: ApiErrorBody | null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }

  /** Исходный текст ошибки от бэка — для логов и отладки, не для UI. */
  get backendMessage(): string | undefined {
    const firstValidation = this.body?.errors
      ? Object.values(this.body.errors).flat()[0]
      : undefined;
    return firstValidation ?? this.body?.message ?? this.body?.title ?? this.body?.detail;
  }
}

function messageForStatus(status: number): string {
  if (status === 0) return "Сервер недоступний. Перевірте з'єднання та спробуйте пізніше.";
  if (status === 400) return "Перевірте правильність введених даних.";
  if (status === 401) return "Потрібно увійти в акаунт.";
  if (status === 403) return "Недостатньо прав для цієї дії.";
  if (status === 404) return "Не знайдено.";
  if (status === 409) return "Дані змінилися. Оновіть сторінку та спробуйте ще раз.";
  if (status >= 500) return "Помилка сервера. Спробуйте пізніше.";
  return "Щось пішло не так. Спробуйте ще раз.";
}

/** Собирает полный адрес запроса с query-параметрами (пустые пропускаются). */
export function buildApiUrl(path: string, query?: Record<string, QueryValue>): string {
  const url = new URL(`${API_URL}${path.startsWith("/") ? "" : "/"}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url.toString();
}

/** Картинки бэк отдаёт относительными путями ("/uploads/...") — дописываем адрес API. */
export function resolveMediaUrl(path: string | null | undefined): string | undefined {
  if (!path) return undefined;
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

async function readErrorBody(response: Response): Promise<ApiErrorBody | null> {
  try {
    const data: unknown = await response.json();
    return typeof data === "object" && data !== null ? (data as ApiErrorBody) : null;
  } catch {
    return null;
  }
}

export async function apiFetch<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { method = "GET", query, body, token, signal, revalidate } = options;

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(buildApiUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
      ...(revalidate === undefined ? { cache: "no-store" as const } : { next: { revalidate } }),
    });
  } catch (error) {
    // Отмену запроса пробрасываем как есть — это не ошибка сервера
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError(0, messageForStatus(0), null);
  }

  if (!response.ok) {
    const errorBody = await readErrorBody(response);
    throw new ApiError(response.status, messageForStatus(response.status), errorBody);
  }

  // 204 No Content и пустые ответы
  const text = await response.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}
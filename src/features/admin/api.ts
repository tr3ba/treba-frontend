"use client";
import { useCallback, useEffect, useRef, useState } from "react";
export class AdminError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
export async function adminRequest<T>(
  path: string,
  options: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const form = options.body instanceof FormData;
  const response = await fetch("/admin-api/" + path, {
    method: options.method ?? "GET",
    cache: "no-store",
    signal: options.signal,
    headers:
      options.body && !form ? { "Content-Type": "application/json" } : {},
    body:
      options.body === undefined
        ? undefined
        : form
          ? (options.body as FormData)
          : JSON.stringify(options.body),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const validation = error.errors
      ? Object.values(error.errors).flat().join(" ")
      : "";
    throw new AdminError(
      response.status,
      response.status === 409
        ? "Дані змінилися. Оновіть запис перед повторним збереженням. Ваші зміни залишилися у формі."
        : validation ||
            error.message ||
            error.detail ||
            error.title ||
            "Не вдалося виконати запит.",
    );
  }
  return response.status === 204 ? (undefined as T) : await response.json();
}
export function useResource<T>(path: string | null, interval = 0) {
  const [data, setData] = useState<T | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  const revision = useRef(0);
  const reload = useCallback(async () => {
    if (!path) {
      setLoading(false);
      return;
    }
    const current = ++revision.current;
    try {
      const result = await adminRequest<T>(path);
      if (current === revision.current) {
        setData(result);
        setError("");
      }
    } catch (error) {
      if (current === revision.current) {
        if (error instanceof AdminError && [401, 403].includes(error.status))
          setData(null);
        setError(
          error instanceof Error ? error.message : "Помилка завантаження.",
        );
        if (
          error instanceof AdminError &&
          error.status === 401 &&
          !path.startsWith("session")
        )
          window.location.assign(
            "/login?next=" +
              encodeURIComponent(
                window.location.pathname + window.location.search,
              ),
          );
      }
    } finally {
      if (current === revision.current) setLoading(false);
    }
  }, [path]);
  const invalidate = useCallback(() => {
    revision.current++;
  }, []);
  useEffect(() => {
    const initial = setTimeout(() => {
      setData(null);
      setLoading(true);
      void reload();
    }, 0);
    const timer = interval
      ? setInterval(() => {
          if (document.visibilityState === "visible") void reload();
        }, interval)
      : undefined;
    return () => {
      invalidate();
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, [reload, interval, invalidate]);
  return { data, setData, error, loading, reload };
}

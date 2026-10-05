"use client";

import { useEffect } from "react";
import StatusPage from "../components/layout/StatusPage";

type ErrorPageProps = {
  error: Error & { digest?: string };
  unstable_retry: () => void;
};

// Показывается, если страница упала при загрузке (например, бэк недоступен)
export default function ErrorPage({ error, unstable_retry }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusPage
      icon="/icons/return.svg"
      title="Щось пішло не так"
      subtitle="Не вдалося завантажити сторінку. Перевірте з'єднання та спробуйте ще раз."
      actionLabel="Спробувати ще раз"
      onAction={() => unstable_retry()}
      details={error.message}
    />
  );
}
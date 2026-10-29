"use client";
import { Button, Card, Hero } from "@/components/admin/ui";
import { useAdminI18n } from "@/features/admin/i18n/provider";

export default function AdminErrorPage({ reset }: { reset: () => void }) {
  const { t } = useAdminI18n();
  return (
    <>
      <Hero title={t("Не вдалося завантажити сторінку")} />
      <Card
        icon="alert"
        title={t("Сервіс тимчасово недоступний. Спробуйте ще раз.")}
      >
        <Button icon="refresh" onClick={reset}>
          {t("Спробувати ще раз")}
        </Button>
      </Card>
    </>
  );
}

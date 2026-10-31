"use client";
import { useAdminI18n } from "@/features/admin/i18n/provider";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useStaff } from "@/components/admin/AdminShell";
import Icon from "@/components/admin/Icon";
import {
  Alert,
  Badge,
  Card,
  Hero,
  Loading,
  Table,
} from "@/components/admin/ui";
import { useResource } from "./api";
type Dashboard = {
  pendingSellers: number | null;
  pendingReviews: number;
  totalUsers: number | null;
  newUsers: number | null;
  recentActivity: {
    kind: string;
    entityId: string;
    name: string;
    status: string;
    occurredAt: string;
  }[];
};
type Metrics = {
  newOrders: number;
  cancelledOrders: number;
  orderedAmount: number;
  openTickets: number;
  overdueTickets: number;
  outOfStockProducts: number;
  overdueModeration: number;
};
type Stats = {
  total: number;
  active: number;
  pending: number;
  drafts: number;
  rejected: number;
  outOfStock: number;
};
export default function Overview() {
  const { date, money, t, label } = useAdminI18n();
  const user = useStaff(),
    params = useSearchParams(),
    router = useRouter(),
    path = usePathname(),
    days = params.get("days") ?? "30";
  const dashboard = useResource<Dashboard>(
    user.role !== "Seller" ? "dashboard?days=" + days : null,
  );
  const metrics = useResource<Metrics>(
    ["Administrator", "Manager"].includes(user.role)
      ? "operations/metrics?days=" + days
      : null,
  );
  const stats = useResource<Stats>("catalog/stats");
  const cards =
    user.role === "Seller"
      ? [
          [
            "box",
            t("Товарів у каталозі"),
            stats.data?.total,
            "/admin/products",
          ],
          [
            "check",
            t("Активні товари"),
            stats.data?.active,
            "/admin/products?status=ACTIVE",
          ],
          [
            "clock",
            t("На модерації"),
            stats.data?.pending,
            "/admin/products?status=PENDING_MODERATION",
          ],
          [
            "layers",
            t("Без залишку"),
            stats.data?.outOfStock,
            "/admin/products?stock=out",
          ],
        ]
      : [
          [
            "bag",
            t("Нові замовлення"),
            metrics.data?.newOrders,
            "/admin/orders",
          ],
          [
            "shield",
            t("Очікують модерації"),
            stats.data?.pending,
            "/admin/moderation",
          ],
          [
            "star",
            t("Відгуки на перевірці"),
            dashboard.data?.pendingReviews,
            "/admin/reviews?status=PENDING",
          ],
          [
            "chat",
            t("Відкриті звернення"),
            metrics.data?.openTickets,
            "/admin/support?status=OPEN",
          ],
        ];

  function selectPeriod(value: string) {
    const next = new URLSearchParams(params);
    next.set("days", value);
    next.delete("page");
    router.push(`${path}?${next}`);
  }

  return (
    <>
      <Hero
        title={t("Вітаємо, {0}", [user.firstName || t("колего")])}
        description={t(
          "Усе важливе для роботи з маркетплейсом — в одному місці.",
        )}
        action={
          <div className="treba-admin-period">
            <div className="treba-admin-period-heading">
              <span className="treba-admin-period-icon"><Icon name="calendar" size={18} /></span>
              <span>{t("Період")}</span>
            </div>
            <div className="treba-admin-period-options" role="group" aria-label={t("Період")}>
              {[7, 30, 90].map((n) => (
                <button
                  key={n}
                  type="button"
                  aria-pressed={days === String(n)}
                  onClick={() => selectPeriod(String(n))}
                >
                  {t("{0} днів", [n])}
                </button>
              ))}
            </div>
          </div>
        }
      />
      <p className="treba-admin-note">
        {t("Показники за вибраний період. Черги відображають поточний стан.")}
      </p>
      <Alert message={dashboard.error || metrics.error || stats.error} />
      <div className="treba-admin-stats">
        {cards
          .filter((c) => c[2] !== undefined && c[2] !== null)
          .map((c) => (
            <Link
              className={`treba-admin-stat tone-${String(c[0])}`}
              key={String(c[1])}
              href={String(c[3])}
            >
              <div className="treba-admin-stat-icon">
                <Icon name={String(c[0])} />
              </div>
              <small>{c[1]}</small>
              <b>{c[2]}</b>
              <span className="treba-admin-stat-open" aria-hidden="true"><Icon name="chevron" size={16} /></span>
            </Link>
          ))}
      </div>
      {stats.loading && <Loading />}
      {metrics.data && (
        <div className="treba-admin-two-grid">
          <Card title={t("Замовлення за період")} icon="bag">
            <div className="treba-admin-detail-list">
              <div>
                <dt>
                  <Icon name="coins" size={18} />
                  {t("Сума розміщених замовлень")}
                </dt>
                <dd>
                  <strong>{money(metrics.data.orderedAmount)}</strong>
                </dd>
              </div>
              <div>
                <dt>
                  <Icon name="close" size={18} />
                  {t("Скасовані замовлення")}
                </dt>
                <dd>{metrics.data.cancelledOrders}</dd>
              </div>
            </div>
            <p className="treba-admin-note">
              {t(
                "Без скасованих і повернутих замовлень. Цей показник не є підтвердженою виручкою.",
              )}
            </p>
          </Card>
          <Card
            title={t("Потребує уваги")}
            icon="alert"
            className="treba-admin-attention"
          >
            <div className="treba-admin-detail-list">
              <div>
                <dt>
                  <Icon name="chat" size={19} />
                  {t("Звернення без відповіді понад 48 год")}
                </dt>
                <dd>{metrics.data.overdueTickets}</dd>
              </div>
              <div>
                <dt>
                  <Icon name="clock" size={19} />
                  {t("Модерація понад 24 год")}
                </dt>
                <dd>{metrics.data.overdueModeration}</dd>
              </div>
              <div>
                <dt>
                  <Icon name="box" size={19} />
                  {t("Товари без залишку")}
                </dt>
                <dd>{metrics.data.outOfStockProducts}</dd>
              </div>
            </div>
          </Card>
        </div>
      )}
      {dashboard.data && (
        <Card title={t("Останні зміни")} icon="clock">
          <Table
            rows={dashboard.data.recentActivity}
            columns={[
              {
                title: t("Запис"),
                render: (row) => (
                  <span className="treba-admin-activity-record">
                    <Icon
                      name={
                        (
                          {
                            product: "box",
                            seller: "shop",
                            review: "star",
                            user: "user",
                          } as Record<string, string>
                        )[row.kind] ?? "file"
                      }
                      size={22}
                    />
                    <strong>{row.name}</strong>
                  </span>
                ),
              },
              { title: t("Розділ"), render: (row) => label(row.kind) },
              {
                title: t("Статус"),
                render: (row) => <Badge value={row.status} />,
              },
              { title: t("Час"), render: (row) => date(row.occurredAt) },
            ]}
          />
          <p className="treba-admin-note">
            {t(
              "Останній стан записів. Повна історія дій доступна в журналі аудиту.",
            )}
          </p>
        </Card>
      )}
      {user.role === "Seller" && (
        <Card icon="file" title={t("Почніть з каталогу")}>
          <p className="treba-admin-note">
            {t(
              "Створюйте товари, завантажуйте фотографії та відправляйте картки на перевірку.",
            )}
          </p>
          <div className="treba-admin-actions">
            <Link
              className="treba-admin-button primary"
              href="/admin/products/new"
            >
              <Icon name="plus" />
              {t("Додати товар")}
            </Link>
            <Link
              className="treba-admin-button secondary"
              href="/admin/products/import"
            >
              <Icon name="upload" />
              {t("Імпорт за посиланням")}
            </Link>
          </div>
        </Card>
      )}
    </>
  );
}

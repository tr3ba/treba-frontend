"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useStaff } from "@/components/admin/AdminShell";
import Icon from "@/components/admin/Icon";
import {
  Alert,
  Badge,
  Card,
  Filters,
  Hero,
  Loading,
  Table,
} from "@/components/admin/ui";
import { date, money, useResource } from "./api";
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
  const user = useStaff(),
    params = useSearchParams(),
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
          ["box", "Товарів у каталозі", stats.data?.total, "/admin/products"],
          [
            "check",
            "Активні товари",
            stats.data?.active,
            "/admin/products?status=ACTIVE",
          ],
          [
            "clock",
            "На модерації",
            stats.data?.pending,
            "/admin/products?status=PENDING_MODERATION",
          ],
          [
            "layers",
            "Без залишку",
            stats.data?.outOfStock,
            "/admin/products?stock=out",
          ],
        ]
      : [
          ["bag", "Нові замовлення", metrics.data?.newOrders, "/admin/orders"],
          [
            "shield",
            "Очікують модерації",
            stats.data?.pending,
            "/admin/moderation",
          ],
          [
            "star",
            "Відгуки на перевірці",
            dashboard.data?.pendingReviews,
            "/admin/reviews?status=PENDING",
          ],
          [
            "chat",
            "Відкриті звернення",
            metrics.data?.openTickets,
            "/admin/support?status=OPEN",
          ],
        ];
  return (
    <>
      <Hero
        title={`Вітаємо, ${user.firstName || "колего"}`}
        description="Усе важливе для роботи з маркетплейсом — в одному місці."
        action={
          <div className="treba-admin-avatar">
            <Icon name="grid" />
          </div>
        }
      />
      <Card>
        <Filters search={false}>
          <select name="days" aria-label="Період" defaultValue={days}>
            {[7, 30, 90].map((n) => (
              <option key={n} value={n}>
                Останні {n} днів
              </option>
            ))}
          </select>
        </Filters>
        <p className="treba-admin-note">
          Показники за вибраний період. Черги відображають поточний стан.
        </p>
      </Card>
      <Alert message={dashboard.error || metrics.error || stats.error} />
      <div className="treba-admin-stats">
        {cards
          .filter((c) => c[2] !== undefined && c[2] !== null)
          .map((c) => (
            <Link className="treba-admin-stat" key={String(c[1])} href={String(c[3])}>
              <div className="treba-admin-stat-icon">
                <Icon name={String(c[0])} />
              </div>
              <small>{c[1]}</small>
              <b>{c[2]}</b>
              <p>Відкрити розділ →</p>
            </Link>
          ))}
      </div>
      {stats.loading && <Loading />}
      {metrics.data && (
        <div className="treba-admin-two-grid">
          <Card title="Замовлення за період">
            <div className="treba-admin-detail-list">
              <div>
                <dt>Сума розміщених замовлень</dt>
                <dd>
                  <strong>{money(metrics.data.orderedAmount)}</strong>
                </dd>
              </div>
              <div>
                <dt>Скасовані замовлення</dt>
                <dd>{metrics.data.cancelledOrders}</dd>
              </div>
            </div>
            <p className="treba-admin-note">
              Без скасованих і повернутих замовлень. Цей показник не є
              підтвердженою виручкою.
            </p>
          </Card>
          <Card title="Потребує уваги">
            <div className="treba-admin-detail-list">
              <div>
                <dt>Звернення без відповіді понад 48 год</dt>
                <dd>{metrics.data.overdueTickets}</dd>
              </div>
              <div>
                <dt>Модерація понад 24 год</dt>
                <dd>{metrics.data.overdueModeration}</dd>
              </div>
              <div>
                <dt>Товари без залишку</dt>
                <dd>{metrics.data.outOfStockProducts}</dd>
              </div>
            </div>
          </Card>
        </div>
      )}
      {dashboard.data && (
        <Card title="Останні зміни">
          <Table
            rows={dashboard.data.recentActivity}
            columns={[
              { title: "Запис", render: (row) => <strong>{row.name}</strong> },
              { title: "Розділ", render: (row) => row.kind },
              {
                title: "Статус",
                render: (row) => <Badge value={row.status} />,
              },
              { title: "Час", render: (row) => date(row.occurredAt) },
            ]}
          />
          <p className="treba-admin-note">
            Останній стан записів. Повна історія дій доступна в журналі аудиту.
          </p>
        </Card>
      )}
      {user.role === "Seller" && (
        <Card title="Почніть з каталогу">
          <p className="treba-admin-note">
            Створюйте товари, завантажуйте фотографії та відправляйте картки на
            перевірку.
          </p>
          <div className="treba-admin-actions">
            <Link className="treba-admin-button primary" href="/admin/products/new">
              <Icon name="plus" />
              Додати товар
            </Link>
            <Link className="treba-admin-button secondary" href="/admin/products/import">
              <Icon name="upload" />
              Імпорт за посиланням
            </Link>
          </div>
        </Card>
      )}
    </>
  );
}

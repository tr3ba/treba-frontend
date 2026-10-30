"use client";
import { useAdminI18n } from "@/features/admin/i18n/provider";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useStaff } from "@/components/admin/AdminShell";
import {
  Alert,
  Badge,
  Button,
  Card,
  Confirm,
  Feedback,
  Field,
  Filters,
  Hero,
  Loading,
  Pagination,
  Table,
  useAction,
} from "@/components/admin/ui";
import { useResource } from "./api";
import type {
  Customer,
  CustomerDetails,
  Order,
  OrderRow,
  Paged,
  TicketRow,
} from "./types";
const orderStatuses = [
  "AWAITING_PAYMENT",
  "PAID",
  "CONFIRMED",
  "PROCESSING",
  "READY_FOR_SHIPMENT",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "RETURN_REQUESTED",
  "RETURNED",
];
export function Orders() {
  const { t } = useAdminI18n();
  const orderColumns = useOrderColumns();
  const params = useSearchParams(),
    resource = useResource<Paged<OrderRow>>("orders?" + params);
  return (
    <>
      <Hero
        title={t("Замовлення")}
        description={t("Оплата, обробка та доставка замовлень маркетплейсу.")}
      />
      <Alert message={resource.error} />
      <Card>
        <Filters statuses={orderStatuses}>
          <input
            name="from"
            type="date"
            aria-label={t("Від дати")}
            defaultValue={params.get("from") ?? ""}
          />
          <input
            name="to"
            type="date"
            aria-label={t("До дати")}
            defaultValue={params.get("to") ?? ""}
          />
        </Filters>
        {resource.loading ? (
          <Loading />
        ) : (
          resource.data && (
            <>
              <Table rows={resource.data.content} columns={orderColumns} />
              <Pagination data={resource.data} />
            </>
          )
        )}
      </Card>
    </>
  );
}
function useOrderColumns() {
  const { date, money, t } = useAdminI18n();
  return [
    {
      title: t("Замовлення"),
      render: (r: OrderRow) => (
        <Link className="treba-admin-text-link" href={`/admin/orders/${r.id}`}>
          {r.orderNumber}
        </Link>
      ),
    },
    { title: t("Покупець"), render: (r: OrderRow) => r.customerName },
    { title: t("Статус"), render: (r: OrderRow) => <Badge value={r.status} /> },
    {
      title: t("Сума"),
      render: (r: OrderRow) => money(r.totalAmount, r.currency),
    },
    { title: t("Дата"), render: (r: OrderRow) => date(r.createdAt) },
  ];
}
export function OrderDetails({ id }: { id: string }) {
  const { date, label, money, t } = useAdminI18n();
  const resource = useResource<Order>("orders/" + id),
    action = useAction(resource.reload),
    staff = useStaff();
  const [status, setStatus] = useState(""),
    [reason, setReason] = useState(""),
    [confirm, setConfirm] = useState(false);
  const order = resource.data;
  return (
    <>
      <Hero
        title={
          order ? t("Замовлення ") + order.summary.orderNumber : t("Замовлення")
        }
        action={
          <Link className="treba-admin-button secondary" href="/admin/orders">
            {t("До списку")}
          </Link>
        }
      />
      <Alert message={resource.error} />
      <Feedback action={action} />
      {resource.loading && <Loading />}
      {order && (
        <>
          <div className="treba-admin-two-grid">
            <Card icon="bag" title={t("Склад замовлення")}>
              {order.partialOrder && (
                <p className="treba-admin-note">
                  {t(
                    "Показано тільки ваші позиції замовлення. Доступні дії визначає сервер.",
                  )}
                </p>
              )}
              <Table
                rows={order.items}
                columns={[
                  {
                    title: t("Товар"),
                    render: (r) => (
                      <>
                        <strong>{r.productName}</strong>
                        <small>
                          {r.variantName} · {r.sku}
                        </small>
                      </>
                    ),
                  },
                  { title: t("Кількість"), render: (r) => r.quantity },
                  { title: t("Ціна"), render: (r) => money(r.unitPrice) },
                  { title: t("Сума"), render: (r) => money(r.totalPrice) },
                ]}
              />
              <div className="treba-admin-detail-list">
                <div>
                  <dt>{t("Вартість товарів")}</dt>
                  <dd>{money(order.subtotal)}</dd>
                </div>
                <div>
                  <dt>{t("Знижка")}</dt>
                  <dd>{money(order.discountAmount)}</dd>
                </div>
                <div>
                  <dt>{t("Доставка")}</dt>
                  <dd>{money(order.deliveryPrice)}</dd>
                </div>
                <div>
                  <dt>{t("Разом")}</dt>
                  <dd>
                    <strong>
                      {money(order.summary.totalAmount, order.summary.currency)}
                    </strong>
                  </dd>
                </div>
              </div>
            </Card>
            <Card icon="user" title={t("Покупець і доставка")}>
              <div className="treba-admin-detail-list">
                <div>
                  <dt>{t("Покупець")}</dt>
                  <dd>{order.summary.customerName}</dd>
                </div>
                <div>
                  <dt>{t("Телефон")}</dt>
                  <dd>{order.recipientPhone}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{order.recipientEmail}</dd>
                </div>
                <div>
                  <dt>{t("Адреса")}</dt>
                  <dd>
                    {order.address
                      ? `${order.address.city}, ${order.address.street}, ${order.address.building}`
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt>{t("Статус")}</dt>
                  <dd>
                    <Badge value={order.summary.status} />
                  </dd>
                </div>
              </div>
              {order.customerComment && (
                <p className="treba-admin-note">
                  {t("Коментар: ")}
                  {order.customerComment}
                </p>
              )}
              {["Administrator", "Manager"].includes(staff.role) && (
                <div className="treba-admin-actions">
                  <Link
                    className="treba-admin-text-link"
                    href={`/admin/customer-activity/${order.summary.customerId}`}
                  >
                    {t("Історія покупця →")}
                  </Link>
                  <Link
                    className="treba-admin-text-link"
                    href={`/admin/support?orderId=${id}`}
                  >
                    {t("Створити звернення →")}
                  </Link>
                </div>
              )}
            </Card>
          </div>
          <div className="treba-admin-two-grid">
            <Card icon="clock" title={t("Історія замовлення")}>
              <div className="treba-admin-timeline">
                {order.history.map((e, i) => (
                  <div key={i}>
                    <Badge value={e.newStatus} />
                    <small>{date(e.createdAt)}</small>
                    <p>{e.comment}</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card icon="clock" title={t("Змінити статус")}>
              {order.allowedStatuses.length ? (
                <>
                  <Field label={t("Наступний статус")}>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="">{t("Оберіть статус")}</option>
                      {order.allowedStatuses.map((s) => (
                        <option key={s} value={s}>
                          {label(s)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t("Причина / службовий коментар")}>
                    <textarea
                      maxLength={500}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </Field>
                  <div className="treba-admin-actions">
                    <Button
                      icon="check"
                      disabled={
                        !status ||
                        action.busy ||
                        (status === "CANCELLED" && !reason.trim())
                      }
                      onClick={() => setConfirm(true)}
                    >
                      {t("Застосувати")}
                    </Button>
                  </div>
                </>
              ) : (
                <p className="treba-admin-note">
                  {t(
                    "Для поточного статусу та вашої ролі немає доступних переходів.",
                  )}
                </p>
              )}
            </Card>
          </div>
        </>
      )}
      {confirm && order && (
        <Confirm
          error={action.error}
          title={t("Змінити статус замовлення?")}
          busy={action.busy}
          onClose={() => setConfirm(false)}
          onConfirm={() =>
            void action
              .run(
                `orders/${id}/status`,
                { status, reason, expectedVersion: order.version },
                "PATCH",
              )
              .then((result) => {
                if (result !== undefined) setConfirm(false);
              })
          }
        >
          <p>
            {label(order.summary.status)} → {label(status)}
          </p>
          {status === "PAID" && (
            <p className="treba-admin-note">
              {t("Підтверджуйте лише фактично отриману оплату.")}
            </p>
          )}
        </Confirm>
      )}
    </>
  );
}
function useTicketColumns() {
  const { date, label, t } = useAdminI18n();
  return [
    {
      title: t("Звернення"),
      render: (r: TicketRow) => (
        <Link className="treba-admin-text-link" href={`/admin/support/${r.id}`}>
          {r.subject}
          {r.unreadCount > 0 && t(" · {0} нових", [r.unreadCount])}
          <small>{r.lastMessage?.slice(0, 100)}</small>
        </Link>
      ),
    },
    { title: t("Покупець"), render: (r: TicketRow) => r.customerName },
    { title: t("Тип"), render: (r: TicketRow) => label(r.kind) },
    {
      title: t("Статус"),
      render: (r: TicketRow) => <Badge value={r.status} />,
    },
    { title: t("Оновлено"), render: (r: TicketRow) => date(r.updatedAt) },
  ];
}
export function Customers({ id }: { id?: string }) {
  const { date, money, t } = useAdminI18n();
  const orderColumns = useOrderColumns(),
    ticketColumns = useTicketColumns();
  const params = useSearchParams(),
    list = useResource<Paged<Customer>>(
      !id ? "operations/customers?" + params : null,
    ),
    details = useResource<CustomerDetails>(
      id ? "operations/customers/" + id : null,
    );
  return (
    <>
      <Hero
        title={details.data?.customer.name ?? t("Покупці")}
        description={t("Історія взаємодії з маркетплейсом.")}
      />
      <Alert message={list.error || details.error} />
      {!id ? (
        <Card>
          <Filters />
          {list.loading ? (
            <Loading />
          ) : (
            list.data && (
              <>
                <Table
                  rows={list.data.content}
                  columns={[
                    {
                      title: t("Покупець"),
                      render: (r) => (
                        <Link
                          className="treba-admin-text-link"
                          href={`/admin/customer-activity/${r.id}`}
                        >
                          {r.name}
                          <small>{r.email}</small>
                        </Link>
                      ),
                    },
                    { title: t("Замовлень"), render: (r) => r.orders },
                    {
                      title: t("Сума замовлень"),
                      render: (r) => money(r.orderedAmount),
                    },
                    { title: t("Відгуків"), render: (r) => r.reviews },
                    {
                      title: t("Останнє замовлення"),
                      render: (r) => date(r.lastOrderAt),
                    },
                  ]}
                />
                <Pagination data={list.data} />
              </>
            )
          )}
        </Card>
      ) : details.loading ? (
        <Loading />
      ) : (
        details.data && (
          <>
            <Card icon="bag" title={t("Замовлення")}>
              <Table rows={details.data.orders} columns={orderColumns} />
            </Card>
            <Card icon="file" title={t("Відгуки")}>
              <Table
                rows={details.data.reviews}
                columns={[
                  { title: t("Товар"), render: (r) => r.productName },
                  { title: t("Оцінка"), render: (r) => `${r.rating} / 5` },
                  { title: t("Відгук"), render: (r) => r.comment },
                  {
                    title: t("Статус"),
                    render: (r) => <Badge value={r.status} />,
                  },
                ]}
              />
            </Card>
            <Card icon="chat" title={t("Звернення")}>
              <Table rows={details.data.tickets} columns={ticketColumns} />
            </Card>
          </>
        )
      )}
    </>
  );
}

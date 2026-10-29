"use client";
import { useAdminI18n } from "@/features/admin/i18n/provider";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useRef, useState } from "react";
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
import { adminRequest, useResource } from "./api";
import type {
  Customer,
  CustomerDetails,
  Message,
  Order,
  OrderRow,
  Paged,
  Ticket,
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
export function Support({ trash = false }: { trash?: boolean }) {
  const { label, t } = useAdminI18n();
  const ticketColumns = useTicketColumns();
  const params = useSearchParams(),
    staff = useStaff(),
    resource = useResource<Paged<TicketRow>>(
      (trash ? "support/deleted?" : "support?") + params,
      5000,
    );
  const capabilities = useResource<{
    canDelete: boolean;
    canRestore: boolean;
  }>("support/capabilities");
  const action = useAction(resource.reload),
    [selected, setSelected] = useState<TicketRow | null>(null),
    [create, setCreate] = useState(false);
  const [kind, setKind] = useState("QUESTION"),
    [subject, setSubject] = useState(""),
    [message, setMessage] = useState(""),
    [orderId, setOrderId] = useState(params.get("orderId") ?? ""),
    requestId = useRef("");
  const [orderSearch, setOrderSearch] = useState("");
  const availableOrders = useResource<Paged<OrderRow>>(
    create ? "orders?size=100&search=" + encodeURIComponent(orderSearch) : null,
  );
  return (
    <>
      <Hero
        title={
          trash
            ? t("Кошик чатів")
            : staff.role === "Seller"
              ? t("Питання покупців")
              : t("Підтримка та повернення")
        }
        description={t("Звернення, повідомлення та історія рішень.")}
        action={
          !trash && ["Administrator", "Manager"].includes(staff.role) ? (
            <Button
              icon="plus"
              onClick={() => {
                setCreate(true);
                requestId.current = crypto.randomUUID();
              }}
            >
              {t("Створити звернення")}
            </Button>
          ) : undefined
        }
      />
      <Alert message={resource.error || capabilities.error} />
      <Feedback action={action} />
      <div className="treba-admin-tabs">
        <Link className="treba-admin-button secondary" href="/admin/support">
          {t("Вхідні")}
        </Link>
        {capabilities.data?.canRestore && (
          <Link
            className="treba-admin-button secondary"
            href="/admin/support/trash"
          >
            {t("Кошик чатів")}
          </Link>
        )}
      </div>
      <Card>
        <Filters
          statuses={
            trash
              ? undefined
              : ["OPEN", "IN_PROGRESS", "APPROVED", "REJECTED", "CLOSED"]
          }
        >
          {!trash && (
            <select
              name="kind"
              aria-label={t("Тип звернення")}
              defaultValue={params.get("kind") ?? ""}
            >
              <option value="">{t("Усі типи")}</option>
              {["CHAT", "QUESTION", "RETURN"].map((k) => (
                <option key={k} value={k}>
                  {label(k)}
                </option>
              ))}
            </select>
          )}
        </Filters>
        {resource.loading ? (
          <Loading />
        ) : (
          resource.data && (
            <>
              <Table
                rows={resource.data.content}
                columns={[
                  ...ticketColumns,
                  {
                    title: t("Дія"),
                    render: (r) =>
                      (
                        trash
                          ? capabilities.data?.canRestore
                          : capabilities.data?.canDelete
                      ) ? (
                        <Button
                          icon="trash"
                          tone={trash ? "secondary" : "danger"}
                          disabled={action.busy}
                          onClick={() => setSelected(r)}
                        >
                          {trash ? t("Відновити") : t("До кошика")}
                        </Button>
                      ) : null,
                  },
                ]}
              />
              <Pagination data={resource.data} />
            </>
          )
        )}
      </Card>
      {selected && (
        <Confirm
          error={action.error}
          title={trash ? t("Відновити чат?") : t("Перемістити чат у кошик?")}
          onClose={() => setSelected(null)}
          busy={action.busy}
          onConfirm={() =>
            void action
              .run(
                `support/${selected.id}${trash ? "/restore" : ""}`,
                { expectedVersion: selected.version },
                trash ? "POST" : "DELETE",
              )
              .then((result) => {
                if (result !== undefined) setSelected(null);
              })
          }
        >
          <p>{selected.subject}</p>
          <p className="treba-admin-note">
            {trash
              ? t("Повідомлення та попередній статус буде відновлено.")
              : t(
                  "Чат зникне з активної черги та кабінету покупця. Історія зберігається.",
                )}
          </p>
        </Confirm>
      )}
      {create && (
        <Confirm
          error={action.error}
          title={t("Нове звернення")}
          busy={action.busy}
          onClose={() => setCreate(false)}
          onConfirm={() => {
            if (!orderId) {
              action.setError(t("Оберіть замовлення для звернення."));
              return;
            }
            if (!subject.trim() || !message.trim()) {
              action.setError(t("Заповніть тему та повідомлення."));
              return;
            }
            void action
              .run<Ticket>("support", {
                subject,
                message,
                kind,
                orderId: orderId || null,
                clientRequestId: requestId.current,
              })
              .then((result) => {
                if (result)
                  window.location.assign("/admin/support/" + result.summary.id);
              });
          }}
        >
          <div className="treba-admin-form-grid">
            <Field label={t("Тип")}>
              <select value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="QUESTION">{t("Питання")}</option>
                <option value="RETURN">{t("Повернення")}</option>
              </select>
            </Field>
            <Field label={t("Знайти замовлення")}>
              <input
                value={orderSearch}
                placeholder={t("Номер, покупець або телефон")}
                onChange={(e) => setOrderSearch(e.target.value)}
              />
            </Field>
            <Field label={t("Замовлення")}>
              <select
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              >
                <option value="">{t("Оберіть замовлення")}</option>
                {orderId &&
                  !availableOrders.data?.content.some(
                    (o) => o.id === orderId,
                  ) && (
                    <option value={orderId}>{t("Поточне замовлення")}</option>
                  )}
                {availableOrders.data?.content.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} · {o.customerName}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={t("Тема *")} wide>
              <input
                maxLength={200}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </Field>
            <Field label={t("Повідомлення *")} wide>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                maxLength={4000}
              />
            </Field>
          </div>
          <Feedback action={action} />
        </Confirm>
      )}
    </>
  );
}
export function TicketDetails({ id }: { id: string }) {
  const { date, label, t } = useAdminI18n();
  const staff = useStaff();
  const resource = useResource<Ticket>("support/" + id, 5000),
    action = useAction(resource.reload),
    [text, setText] = useState(""),
    [internal, setInternal] = useState(false),
    [older, setOlder] = useState<Message[]>([]),
    [hasMore, setHasMore] = useState(true),
    [status, setStatus] = useState(""),
    [confirm, setConfirm] = useState(false);
  const messageId = useRef(""),
    ticket = resource.data;
  async function sendMessage() {
    if (!text.trim()) return;
    if (!messageId.current) messageId.current = crypto.randomUUID();
    try {
      await adminRequest(`support/${id}/messages`, {
        method: "POST",
        body: { message: text, internal, clientMessageId: messageId.current },
      });
      setText("");
      messageId.current = "";
      await resource.reload();
    } catch (e) {
      action.setError(e instanceof Error ? e.message : t("Помилка надсилання"));
    }
  }
  async function earlier() {
    const before = older[0]?.id ?? ticket?.messages[0]?.id;
    if (!before) return;
    try {
      const page = await adminRequest<{
        messages: Message[];
        hasMore: boolean;
      }>(`support/${id}/messages?before=${before}`);
      setOlder((previous) => [
        ...page.messages.filter((m) => !previous.some((p) => p.id === m.id)),
        ...previous,
      ]);
      setHasMore(page.hasMore);
    } catch (e) {
      action.setError(e instanceof Error ? e.message : t("Помилка історії"));
    }
  }
  return (
    <>
      <Hero
        title={ticket?.summary.subject ?? t("Звернення")}
        description={
          ticket
            ? `${ticket.summary.customerName} · ${label(ticket.summary.kind)}`
            : undefined
        }
        action={
          <Link className="treba-admin-button secondary" href="/admin/support">
            {t("До звернень")}
          </Link>
        }
      />
      <Alert message={resource.error} />
      <Feedback action={action} />
      {resource.loading && <Loading />}
      {ticket && (
        <div className="treba-admin-two-grid">
          <Card icon="chat" title={t("Переписка")}>
            {ticket.hasEarlierMessages && hasMore && (
              <Button tone="secondary" onClick={() => void earlier()}>
                {t("Завантажити попередні повідомлення")}
              </Button>
            )}
            <div className="treba-admin-message-list">
              {[...older, ...ticket.messages]
                .filter(
                  (m, i, all) => all.findIndex((v) => v.id === m.id) === i,
                )
                .map((m) => (
                  <article
                    className={`treba-admin-message ${m.internal ? "internal" : m.authorRole === "Customer" ? "" : "staff"}`}
                    key={m.id}
                  >
                    <header>
                      <b>{m.authorName}</b>
                      <time>{date(m.createdAt)}</time>
                    </header>
                    {m.internal && (
                      <small>
                        {t("Внутрішня нотатка · покупець не бачить")}
                      </small>
                    )}
                    <p>{m.message}</p>
                  </article>
                ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void sendMessage();
              }}
            >
              <Field label={t("Повідомлення")}>
                <textarea
                  value={text}
                  maxLength={4000}
                  required
                  onChange={(e) => {
                    setText(e.target.value);
                    messageId.current = "";
                  }}
                  placeholder={t("Напишіть відповідь…")}
                />
              </Field>
              {staff.role !== "Seller" && (
                <label className="treba-admin-check">
                  <input
                    type="checkbox"
                    checked={internal}
                    onChange={(e) => {
                      setInternal(e.target.checked);
                      messageId.current = "";
                    }}
                  />
                  {t("Внутрішня нотатка")}
                </label>
              )}
              <div className="treba-admin-actions">
                <Button type="submit" icon="arrow" disabled={!text.trim()}>
                  {t("Надіслати")}
                </Button>
                <Button
                  tone="secondary"
                  onClick={() => {
                    const last = ticket.messages.at(-1);
                    if (last)
                      void action.run(`support/${id}/read`, {
                        messageId: last.id,
                      });
                  }}
                >
                  {t("Позначити прочитаним")}
                </Button>
              </div>
            </form>
          </Card>
          <div>
            <Card icon="file" title={t("Деталі звернення")}>
              <div className="treba-admin-detail-list">
                <div>
                  <dt>{t("Статус")}</dt>
                  <dd>
                    <Badge value={ticket.summary.status} />
                  </dd>
                </div>
                <div>
                  <dt>{t("Покупець")}</dt>
                  <dd>{ticket.summary.customerName}</dd>
                </div>
                <div>
                  <dt>{t("Замовлення")}</dt>
                  <dd>
                    {ticket.summary.orderId ? (
                      <Link
                        className="treba-admin-text-link"
                        href={`/admin/orders/${ticket.summary.orderId}`}
                      >
                        {ticket.summary.orderNumber ?? t("Відкрити")}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div>
                  <dt>{t("Товар")}</dt>
                  <dd>{ticket.summary.productName ?? "—"}</dd>
                </div>
              </div>
            </Card>
            <Card icon="file" title={t("Рішення")}>
              {ticket.allowedStatuses.length ? (
                <>
                  <Field label={t("Новий статус")}>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="">{t("Оберіть…")}</option>
                      {ticket.allowedStatuses.map((s) => (
                        <option key={s} value={s}>
                          {label(s)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <div className="treba-admin-actions">
                    <Button
                      icon="edit"
                      disabled={!status || action.busy}
                      onClick={() => setConfirm(true)}
                    >
                      {t("Змінити статус")}
                    </Button>
                  </div>
                </>
              ) : (
                <p className="treba-admin-note">{t("Немає доступних дій.")}</p>
              )}
            </Card>
          </div>
        </div>
      )}
      {confirm && ticket && (
        <Confirm
          error={action.error}
          title={t("Підтвердити зміну статусу?")}
          busy={action.busy}
          onClose={() => setConfirm(false)}
          onConfirm={() =>
            void action
              .run(
                `support/${id}/status`,
                { status, expectedVersion: ticket.summary.version },
                "PATCH",
              )
              .then((result) => {
                if (result !== undefined) setConfirm(false);
              })
          }
        >
          <p>{label(status)}</p>
          {ticket.summary.kind === "RETURN" &&
            status === "CLOSED" &&
            ticket.summary.status === "APPROVED" && (
              <p className="treba-admin-note">
                {t(
                  "Ви підтверджуєте фактичне отримання всіх повернутих товарів, придатних до продажу. Залишки буде відновлено. Це не виконує грошовий переказ покупцю.",
                )}
              </p>
            )}
        </Confirm>
      )}
    </>
  );
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

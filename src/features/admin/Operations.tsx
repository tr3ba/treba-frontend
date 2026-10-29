"use client";
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
  label,
  useAction,
} from "@/components/admin/ui";
import { adminRequest, date, money, useResource } from "./api";
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
  const params = useSearchParams(),
    resource = useResource<Paged<OrderRow>>("orders?" + params);
  return (
    <>
      <Hero
        title="Замовлення"
        description="Оплата, обробка та доставка замовлень маркетплейсу."
      />
      <Alert message={resource.error} />
      <Card>
        <Filters statuses={orderStatuses}>
          <input
            name="from"
            type="date"
            aria-label="Від дати"
            defaultValue={params.get("from") ?? ""}
          />
          <input
            name="to"
            type="date"
            aria-label="До дати"
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
const orderColumns = [
  {
    title: "Замовлення",
    render: (r: OrderRow) => (
      <Link className="ad-text-link" href={`/admin/orders/${r.id}`}>
        {r.orderNumber}
      </Link>
    ),
  },
  { title: "Покупець", render: (r: OrderRow) => r.customerName },
  { title: "Статус", render: (r: OrderRow) => <Badge value={r.status} /> },
  { title: "Сума", render: (r: OrderRow) => money(r.totalAmount, r.currency) },
  { title: "Дата", render: (r: OrderRow) => date(r.createdAt) },
];
export function OrderDetails({ id }: { id: string }) {
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
        title={order ? "Замовлення " + order.summary.orderNumber : "Замовлення"}
        action={
          <Link className="ad-button secondary" href="/admin/orders">
            До списку
          </Link>
        }
      />
      <Alert message={resource.error} />
      <Feedback action={action} />
      {resource.loading && <Loading />}
      {order && (
        <>
          <div className="ad-two-grid">
            <Card title="Склад замовлення">
              {order.partialOrder && (
                <p className="ad-note">
                  Показано тільки ваші позиції замовлення. Доступні дії визначає
                  сервер.
                </p>
              )}
              <Table
                rows={order.items}
                columns={[
                  {
                    title: "Товар",
                    render: (r) => (
                      <>
                        <strong>{r.productName}</strong>
                        <small>
                          {r.variantName} · {r.sku}
                        </small>
                      </>
                    ),
                  },
                  { title: "Кількість", render: (r) => r.quantity },
                  { title: "Ціна", render: (r) => money(r.unitPrice) },
                  { title: "Сума", render: (r) => money(r.totalPrice) },
                ]}
              />
              <div className="ad-detail-list">
                <div>
                  <dt>Вартість товарів</dt>
                  <dd>{money(order.subtotal)}</dd>
                </div>
                <div>
                  <dt>Знижка</dt>
                  <dd>{money(order.discountAmount)}</dd>
                </div>
                <div>
                  <dt>Доставка</dt>
                  <dd>{money(order.deliveryPrice)}</dd>
                </div>
                <div>
                  <dt>Разом</dt>
                  <dd>
                    <strong>
                      {money(order.summary.totalAmount, order.summary.currency)}
                    </strong>
                  </dd>
                </div>
              </div>
            </Card>
            <Card title="Покупець і доставка">
              <div className="ad-detail-list">
                <div>
                  <dt>Покупець</dt>
                  <dd>{order.summary.customerName}</dd>
                </div>
                <div>
                  <dt>Телефон</dt>
                  <dd>{order.recipientPhone}</dd>
                </div>
                <div>
                  <dt>Email</dt>
                  <dd>{order.recipientEmail}</dd>
                </div>
                <div>
                  <dt>Адреса</dt>
                  <dd>
                    {order.address
                      ? `${order.address.city}, ${order.address.street}, ${order.address.building}`
                      : "—"}
                  </dd>
                </div>
                <div>
                  <dt>Статус</dt>
                  <dd>
                    <Badge value={order.summary.status} />
                  </dd>
                </div>
              </div>
              {order.customerComment && (
                <p className="ad-note">Коментар: {order.customerComment}</p>
              )}
              {["Administrator", "Manager"].includes(staff.role) && (
                <div className="ad-actions">
                  <Link
                    className="ad-text-link"
                    href={`/admin/customer-activity/${order.summary.customerId}`}
                  >
                    Історія покупця →
                  </Link>
                  <Link
                    className="ad-text-link"
                    href={`/admin/support?orderId=${id}`}
                  >
                    Створити звернення →
                  </Link>
                </div>
              )}
            </Card>
          </div>
          <div className="ad-two-grid">
            <Card title="Історія замовлення">
              <div className="ad-timeline">
                {order.history.map((e, i) => (
                  <div key={i}>
                    <Badge value={e.newStatus} />
                    <small>{date(e.createdAt)}</small>
                    <p>{e.comment}</p>
                  </div>
                ))}
              </div>
            </Card>
            <Card title="Змінити статус">
              {order.allowedStatuses.length ? (
                <>
                  <Field label="Наступний статус">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="">Оберіть статус</option>
                      {order.allowedStatuses.map((s) => (
                        <option key={s} value={s}>
                          {label(s)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Причина / службовий коментар">
                    <textarea
                      maxLength={500}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                    />
                  </Field>
                  <div className="ad-actions">
                    <Button
                      disabled={
                        !status ||
                        action.busy ||
                        (status === "CANCELLED" && !reason.trim())
                      }
                      onClick={() => setConfirm(true)}
                    >
                      Застосувати
                    </Button>
                  </div>
                </>
              ) : (
                <p className="ad-note">
                  Для поточного статусу та вашої ролі немає доступних переходів.
                </p>
              )}
            </Card>
          </div>
        </>
      )}
      {confirm && order && (
        <Confirm
          error={action.error}
          title="Змінити статус замовлення?"
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
            <p className="ad-note">
              Підтверджуйте лише фактично отриману оплату.
            </p>
          )}
        </Confirm>
      )}
    </>
  );
}
const ticketColumns = [
  {
    title: "Звернення",
    render: (r: TicketRow) => (
      <Link className="ad-text-link" href={`/admin/support/${r.id}`}>
        {r.subject}
        {r.unreadCount > 0 && ` · ${r.unreadCount} нових`}
        <small>{r.lastMessage?.slice(0, 100)}</small>
      </Link>
    ),
  },
  { title: "Покупець", render: (r: TicketRow) => r.customerName },
  { title: "Тип", render: (r: TicketRow) => label(r.kind) },
  { title: "Статус", render: (r: TicketRow) => <Badge value={r.status} /> },
  { title: "Оновлено", render: (r: TicketRow) => date(r.updatedAt) },
];
export function Support({ trash = false }: { trash?: boolean }) {
  const params = useSearchParams(),
    staff = useStaff(),
    resource = useResource<Paged<TicketRow>>(
      (trash ? "support/deleted?" : "support?") + params,
      5000,
    );
  const capabilities = useResource<{ canDelete: boolean; canRestore: boolean }>(
    "support/capabilities",
  );
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
            ? "Кошик чатів"
            : staff.role === "Seller"
              ? "Питання покупців"
              : "Підтримка та повернення"
        }
        description="Звернення, повідомлення та історія рішень."
        action={
          !trash && ["Administrator", "Manager"].includes(staff.role) ? (
            <Button
              icon="plus"
              onClick={() => {
                setCreate(true);
                requestId.current = crypto.randomUUID();
              }}
            >
              Створити звернення
            </Button>
          ) : undefined
        }
      />
      <Alert message={resource.error || capabilities.error} />
      <Feedback action={action} />
      <div className="ad-tabs">
        <Link className="ad-button secondary" href="/admin/support">
          Вхідні
        </Link>
        {capabilities.data?.canRestore && (
          <Link className="ad-button secondary" href="/admin/support/trash">
            Кошик чатів
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
              aria-label="Тип звернення"
              defaultValue={params.get("kind") ?? ""}
            >
              <option value="">Усі типи</option>
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
                    title: "Дія",
                    render: (r) =>
                      (
                        trash
                          ? capabilities.data?.canRestore
                          : capabilities.data?.canDelete
                      ) ? (
                        <Button
                          tone={trash ? "secondary" : "danger"}
                          disabled={action.busy}
                          onClick={() => setSelected(r)}
                        >
                          {trash ? "Відновити" : "До кошика"}
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
          title={trash ? "Відновити чат?" : "Перемістити чат у кошик?"}
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
          <p className="ad-note">
            {trash
              ? "Повідомлення та попередній статус буде відновлено."
              : "Чат зникне з активної черги та кабінету покупця. Історія зберігається."}
          </p>
        </Confirm>
      )}
      {create && (
        <Confirm
          error={action.error}
          title="Нове звернення"
          busy={action.busy}
          onClose={() => setCreate(false)}
          onConfirm={() => {
            if (!orderId) {
              action.setError("Оберіть замовлення для звернення.");
              return;
            }
            if (!subject.trim() || !message.trim()) {
              action.setError("Заповніть тему та повідомлення.");
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
          <div className="ad-form-grid">
            <Field label="Тип">
              <select value={kind} onChange={(e) => setKind(e.target.value)}>
                <option value="QUESTION">Питання</option>
                <option value="RETURN">Повернення</option>
              </select>
            </Field>
            <Field label="Знайти замовлення">
              <input
                value={orderSearch}
                placeholder="Номер, покупець або телефон"
                onChange={(e) => setOrderSearch(e.target.value)}
              />
            </Field>
            <Field label="Замовлення">
              <select
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              >
                <option value="">Оберіть замовлення</option>
                {orderId &&
                  !availableOrders.data?.content.some(
                    (o) => o.id === orderId,
                  ) && <option value={orderId}>Поточне замовлення</option>}
                {availableOrders.data?.content.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.orderNumber} · {o.customerName}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Тема *" wide>
              <input
                maxLength={200}
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </Field>
            <Field label="Повідомлення *" wide>
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
      action.setError(e instanceof Error ? e.message : "Помилка надсилання");
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
      action.setError(e instanceof Error ? e.message : "Помилка історії");
    }
  }
  return (
    <>
      <Hero
        title={ticket?.summary.subject ?? "Звернення"}
        description={
          ticket
            ? `${ticket.summary.customerName} · ${label(ticket.summary.kind)}`
            : undefined
        }
        action={
          <Link className="ad-button secondary" href="/admin/support">
            До звернень
          </Link>
        }
      />
      <Alert message={resource.error} />
      <Feedback action={action} />
      {resource.loading && <Loading />}
      {ticket && (
        <div className="ad-two-grid">
          <Card title="Переписка">
            {ticket.hasEarlierMessages && hasMore && (
              <Button tone="secondary" onClick={() => void earlier()}>
                Завантажити попередні повідомлення
              </Button>
            )}
            <div className="ad-message-list">
              {[...older, ...ticket.messages]
                .filter(
                  (m, i, all) => all.findIndex((v) => v.id === m.id) === i,
                )
                .map((m) => (
                  <article
                    className={`ad-message ${m.internal ? "internal" : m.authorRole === "Customer" ? "" : "staff"}`}
                    key={m.id}
                  >
                    <header>
                      <b>{m.authorName}</b>
                      <time>{date(m.createdAt)}</time>
                    </header>
                    {m.internal && (
                      <small>Внутрішня нотатка · покупець не бачить</small>
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
              <Field label="Повідомлення">
                <textarea
                  value={text}
                  maxLength={4000}
                  required
                  onChange={(e) => {
                    setText(e.target.value);
                    messageId.current = "";
                  }}
                  placeholder="Напишіть відповідь…"
                />
              </Field>
              {staff.role !== "Seller" && (
                <label className="ad-check">
                  <input
                    type="checkbox"
                    checked={internal}
                    onChange={(e) => {
                      setInternal(e.target.checked);
                      messageId.current = "";
                    }}
                  />
                  Внутрішня нотатка
                </label>
              )}
              <div className="ad-actions">
                <Button type="submit" icon="arrow" disabled={!text.trim()}>
                  Надіслати
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
                  Позначити прочитаним
                </Button>
              </div>
            </form>
          </Card>
          <div>
            <Card title="Деталі звернення">
              <div className="ad-detail-list">
                <div>
                  <dt>Статус</dt>
                  <dd>
                    <Badge value={ticket.summary.status} />
                  </dd>
                </div>
                <div>
                  <dt>Покупець</dt>
                  <dd>{ticket.summary.customerName}</dd>
                </div>
                <div>
                  <dt>Замовлення</dt>
                  <dd>
                    {ticket.summary.orderId ? (
                      <Link
                        className="ad-text-link"
                        href={`/admin/orders/${ticket.summary.orderId}`}
                      >
                        {ticket.summary.orderNumber ?? "Відкрити"}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </dd>
                </div>
                <div>
                  <dt>Товар</dt>
                  <dd>{ticket.summary.productName ?? "—"}</dd>
                </div>
              </div>
            </Card>
            <Card title="Рішення">
              {ticket.allowedStatuses.length ? (
                <>
                  <Field label="Новий статус">
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                    >
                      <option value="">Оберіть…</option>
                      {ticket.allowedStatuses.map((s) => (
                        <option key={s} value={s}>
                          {label(s)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <div className="ad-actions">
                    <Button
                      disabled={!status || action.busy}
                      onClick={() => setConfirm(true)}
                    >
                      Змінити статус
                    </Button>
                  </div>
                </>
              ) : (
                <p className="ad-note">Немає доступних дій.</p>
              )}
            </Card>
          </div>
        </div>
      )}
      {confirm && ticket && (
        <Confirm
          error={action.error}
          title="Підтвердити зміну статусу?"
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
              <p className="ad-note">
                Ви підтверджуєте фактичне отримання всіх повернутих товарів,
                придатних до продажу. Залишки буде відновлено. Це не виконує
                грошовий переказ покупцю.
              </p>
            )}
        </Confirm>
      )}
    </>
  );
}
export function Customers({ id }: { id?: string }) {
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
        title={details.data?.customer.name ?? "Покупці"}
        description="Історія взаємодії з маркетплейсом."
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
                      title: "Покупець",
                      render: (r) => (
                        <Link
                          className="ad-text-link"
                          href={`/admin/customer-activity/${r.id}`}
                        >
                          {r.name}
                          <small>{r.email}</small>
                        </Link>
                      ),
                    },
                    { title: "Замовлень", render: (r) => r.orders },
                    {
                      title: "Сума замовлень",
                      render: (r) => money(r.orderedAmount),
                    },
                    { title: "Відгуків", render: (r) => r.reviews },
                    {
                      title: "Останнє замовлення",
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
            <Card title="Замовлення">
              <Table rows={details.data.orders} columns={orderColumns} />
            </Card>
            <Card title="Відгуки">
              <Table
                rows={details.data.reviews}
                columns={[
                  { title: "Товар", render: (r) => r.productName },
                  { title: "Оцінка", render: (r) => `${r.rating} / 5` },
                  { title: "Відгук", render: (r) => r.comment },
                  {
                    title: "Статус",
                    render: (r) => <Badge value={r.status} />,
                  },
                ]}
              />
            </Card>
            <Card title="Звернення">
              <Table rows={details.data.tickets} columns={ticketColumns} />
            </Card>
          </>
        )
      )}
    </>
  );
}

"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { useStaff } from "@/components/admin/AdminShell";
import Icon from "@/components/admin/Icon";
import { Alert, Badge, Button, Confirm, Feedback, Field, Hero, Loading, useAction } from "@/components/admin/ui";
import { adminRequest, useResource } from "./api";
import { useAdminI18n } from "./i18n/provider";
import { mergeSupportMessages, supportHref, supportQuery, supportStatusEvent } from "./support-inbox";
import type { Message, OrderRow, Paged, Ticket, TicketRow } from "./types";

type Capabilities = { canDelete: boolean; canRestore: boolean };
type Draft = { text: string; internal: boolean; clientMessageId: string };
const statuses = ["OPEN", "IN_PROGRESS", "APPROVED", "REJECTED", "CLOSED"];

export default function Support({ trash = false, ticketId }: { trash?: boolean; ticketId?: string }) {
  const { date, label, t } = useAdminI18n();
  const staff = useStaff(), router = useRouter(), params = useSearchParams();
  const query = supportQuery(new URLSearchParams(params), trash).toString();
  const resource = useResource<Paged<TicketRow>>(`${trash ? "support/deleted" : "support"}?${query}`, 5000);
  const { setData: setListData } = resource;
  const capabilities = useResource<Capabilities>("support/capabilities");
  const selectedId = ticketId ?? params.get("ticket");
  const selected = resource.data?.content.find(row => row.id === selectedId);
  const drafts = useRef(new Map<string, Draft>());
  const action = useAction(resource.reload);
  const [create, setCreate] = useState(false), [restore, setRestore] = useState(false);
  const [kind, setKind] = useState("QUESTION"), [subject, setSubject] = useState("");
  const [message, setMessage] = useState(""), [orderId, setOrderId] = useState(params.get("orderId") ?? "");
  const requestId = useRef("");
  const [orderSearch, setOrderSearch] = useState("");
  const availableOrders = useResource<Paged<OrderRow>>(create ? "orders?size=100&search=" + encodeURIComponent(orderSearch) : null);
  const href = (changes: Record<string, string | null>, deleted = trash) => supportHref(new URLSearchParams(params), changes, deleted);
  const updateFilter = (changes: Record<string, string | null>) => router.push(href({ ...changes, ticket: null, page: null }), { scroll: false });
  const afterRemoval = () => {
    const page = resource.data?.page ?? 1;
    router.replace(href({ ticket: null, page: page > 1 && resource.data?.content.length === 1 ? String(page - 1) : params.get("page") }), { scroll: false });
  };
  const onRead = useCallback((id: string, version: string) => setListData(previous => previous ? {
    ...previous, content: previous.content.map(row => row.id === id && row.version === version ? { ...row, unreadCount: 0 } : row),
  } : previous), [setListData]);
  const openCreated = (id: string) => {
    setCreate(false); setSubject(""); setMessage("");
    router.push(`/admin/support?ticket=${id}`, { scroll: false });
  };
  const queue = params.get("view") ?? "";
  const preview = (row: TicketRow) => {
    const event = supportStatusEvent(row.lastMessage ?? "");
    return event ? `${label(event[0])} → ${label(event[1])}` : row.lastMessage || t("Повідомлень ще немає");
  };
  return <>
    <Hero title={trash ? t("Кошик чатів") : staff.role === "Seller" ? t("Питання покупців") : t("Підтримка та повернення")}
      description={t("Усі розмови з покупцями — в одному місці.")}
      action={!trash && ["Administrator", "Manager"].includes(staff.role) ? <Button icon="plus" onClick={() => {
        action.setError(""); action.setSuccess(""); setCreate(true); requestId.current = crypto.randomUUID();
      }}>{t("Створити звернення")}</Button> : undefined} />
    <Alert message={capabilities.error} />
    <div className="treba-admin-inbox-tabs" role="navigation" aria-label={t("Черги звернень")}>
      {[
        { view: "", name: t("Вхідні"), icon: "mail" },
        { view: "unread", name: t("Непрочитані"), icon: "bell" },
        { view: "open", name: t("Активні"), icon: "chat" },
      ].map(tab => <Link key={tab.view} scroll={false}
        href={href({ view: tab.view, ticket: null, status: null, kind: null, page: null }, false)}
        className={!trash && queue === tab.view ? "active" : ""} aria-current={!trash && queue === tab.view ? "page" : undefined}>
        <Icon name={tab.icon} size={18} />{tab.name}
      </Link>)}
      {capabilities.data?.canRestore && <Link scroll={false} href="/admin/support/trash" className={trash ? "active" : ""} aria-current={trash ? "page" : undefined}>
        <Icon name="trash" size={18} />{t("Кошик чатів")}
      </Link>}
    </div>
    <div className={`treba-admin-inbox ${selectedId ? "has-selection" : ""}`}>
      <section className="treba-admin-inbox-list" aria-label={t("Список звернень")}>
        <div className="treba-admin-inbox-filters">
          <form key={params.get("search") ?? ""} onSubmit={event => { event.preventDefault(); updateFilter({ search: String(new FormData(event.currentTarget).get("search") ?? "").trim() }); }}>
            <Icon name="search" size={19} />
            <input aria-label={t("Пошук звернень")} placeholder={t("Тема, покупець, замовлення…")} defaultValue={params.get("search") ?? ""}
              maxLength={200} name="search" />
            <button type="submit" aria-label={t("Знайти")}><Icon name="arrow" size={18} /></button>
          </form>
          {!trash && <div className="treba-admin-inbox-filter-row">
            <select aria-label={t("Статус звернення")} value={params.get("status") ?? ""} onChange={event => updateFilter({ status: event.target.value })}>
              <option value="">{t("Усі статуси")}</option>{statuses.map(status => <option key={status} value={status}>{label(status)}</option>)}
            </select>
            <select aria-label={t("Тип звернення")} value={params.get("kind") ?? ""} onChange={event => updateFilter({ kind: event.target.value })}>
              <option value="">{t("Усі типи")}</option>{["CHAT", "QUESTION", "RETURN"].map(kind => <option key={kind} value={kind}>{label(kind)}</option>)}
            </select>
          </div>}
          <div className="treba-admin-inbox-list-caption"><b>{t("Звернення")}</b><span>{resource.data?.totalElements ?? "—"}</span>
            {(params.get("search") || params.get("status") || params.get("kind") || params.get("orderId") || params.get("productId")) && <Link scroll={false}
              href={href({ search: null, status: null, kind: null, orderId: null, productId: null, ticket: null, page: null })}>{t("Скинути фільтри")}</Link>}
          </div>
        </div>
        <Alert message={resource.error} />
        <div className="treba-admin-inbox-tickets" aria-busy={resource.loading}>
          {resource.loading ? <Loading /> : !resource.data?.content.length ? <div className="treba-admin-inbox-empty-list">
            <Icon name={trash ? "archive" : "check"} size={30} /><b>{t("Звернень не знайдено")}</b><p>{t("Спробуйте інший пошук або змініть фільтри.")}</p>
          </div> : resource.data.content.map(row => <Link key={row.id} scroll={false} href={href({ ticket: row.id })}
            className={`treba-admin-ticket ${row.id === selectedId ? "selected" : ""} ${row.unreadCount ? "unread" : ""}`} aria-current={row.id === selectedId ? "true" : undefined}>
            <span className={`treba-admin-ticket-icon ${row.kind.toLowerCase()}`}><Icon name={row.kind === "RETURN" ? "return" : row.kind === "CHAT" ? "chat" : "bag"} size={19} /></span>
            <div className="treba-admin-ticket-copy">
              <div className="treba-admin-ticket-top"><b>{row.customerName}</b>{row.unreadCount > 0 && <span className="treba-admin-ticket-unread" aria-label={t("Непрочитаних: {0}", [row.unreadCount])}>{row.unreadCount}</span>}</div>
              <strong>{row.subject}</strong><p>{preview(row)}</p>
              <div className="treba-admin-ticket-meta"><Badge value={row.status} /><time dateTime={row.updatedAt}>{date(row.updatedAt)}</time></div>
            </div><Icon name="chevron" size={16} />
          </Link>)}
        </div>
        {resource.data && <nav className="treba-admin-inbox-pages" aria-label={t("Сторінки")}>
          {resource.data.page > 1 ? <Link scroll={false} aria-label={t("Попередня сторінка")} href={href({ page: String(resource.data.page - 1) })}><Icon name="arrowLeft" size={18} /></Link> : <span />}
          <span>{resource.data.page} / {Math.max(1, resource.data.totalPages)}</span>
          {resource.data.page < resource.data.totalPages ? <Link scroll={false} aria-label={t("Наступна сторінка")} href={href({ page: String(resource.data.page + 1) })}><Icon name="arrowRight" size={18} /></Link> : <span />}
        </nav>}
      </section>
      <section className="treba-admin-inbox-pane" aria-label={t("Переписка")}>
        {selectedId ? <>
          <Link scroll={false} href={href({ ticket: null })} className="treba-admin-inbox-back"><Icon name="arrowLeft" size={18} />{t("До звернень")}</Link>
          {trash ? selected ? <div className="treba-admin-inbox-deleted">
            <span className="treba-admin-inbox-empty-icon"><Icon name="archive" size={32} /></span>
            <h2>{selected.subject}</h2><p>{selected.customerName}</p><Badge value={selected.status} />
            <p>{t("Відновіть звернення, щоб продовжити перегляд переписки.")}</p>
            {capabilities.data?.canRestore && <Button icon="refresh" onClick={() => { action.setError(""); setRestore(true); }}>{t("Відновити")}</Button>}
          </div> : resource.loading ? <Loading /> : <div className="treba-admin-inbox-placeholder"><p>{t("Оберіть звернення зі списку.")}</p></div> :
            <Conversation key={selectedId} id={selectedId} drafts={drafts} capabilities={capabilities.data} onRead={onRead} onChanged={resource.reload} onRemoved={afterRemoval} />}
        </> : <div className="treba-admin-inbox-placeholder">
          <span className="treba-admin-inbox-empty-icon"><Icon name="chat" size={36} /></span>
          <h2>{t("Кожна розмова має значення")}</h2><p>{t("Оберіть звернення зі списку, щоб побачити історію та відповісти покупцю.")}</p>
          <div><Icon name="shield" size={17} />{t("Внутрішні нотатки бачить лише команда")}</div>
        </div>}
      </section>
    </div>
    {restore && selected && <Confirm title={t("Відновити чат?")} confirmLabel={t("Відновити")} error={action.error} busy={action.busy} onClose={() => setRestore(false)}
      onConfirm={() => void action.run(`support/${selected.id}/restore`, { expectedVersion: selected.version }).then(result => { if (result !== undefined) { setRestore(false); afterRemoval(); } })}>
      <p>{selected.subject}</p><p>{t("Повідомлення та попередній статус буде відновлено.")}</p>
    </Confirm>}
      {create && (
        <Confirm
          error={action.error}
          title={t("Нове звернення")}
          confirmLabel={t("Створити звернення")}
          confirmIcon="plus"
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
                  openCreated(result.summary.id);
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
  </>;
}

function Conversation({ id, capabilities, drafts, onRead, onChanged, onRemoved }: {
  id: string; capabilities: Capabilities | null; drafts: RefObject<Map<string, Draft>>;
  onRead: (id: string, version: string) => void; onChanged: () => Promise<void>; onRemoved: () => void;
}) {
  const { date, label, t } = useAdminI18n(), staff = useStaff();
  const resource = useResource<Ticket>("support/" + id, 5000), ticket = resource.data;
  const { setData: setTicketData } = resource;
  const action = useAction(async () => { await Promise.all([resource.reload(), onChanged()]); });
  const [draft, setDraft] = useState<Draft>(() => drafts.current.get(id) ?? { text: "", internal: false, clientMessageId: "" });
  const [older, setOlder] = useState<Message[]>([]), [hasMore, setHasMore] = useState(true), [loadingOlder, setLoadingOlder] = useState(false);
  const [status, setStatus] = useState(""), [confirm, setConfirm] = useState<"status" | "trash" | null>(null);
  const [readError, setReadError] = useState("");
  const reading = useRef(""), sending = useRef(false), history = useRef<HTMLDivElement>(null), heading = useRef<HTMLHeadingElement>(null);
  const nearBottom = useRef(true), ready = !!ticket, lastMessageId = ticket?.messages.at(-1)?.id;
  const read = useCallback(async (messageId: string, version: string) => {
    reading.current = messageId;
    try {
      await adminRequest(`support/${id}/read`, { method: "POST", body: { messageId } });
      setReadError("");
      setTicketData(previous => previous?.summary.version === version ? { ...previous, summary: { ...previous.summary, unreadCount: 0 } } : previous);
      onRead(id, version);
    } catch (error) { setReadError(error instanceof Error ? error.message : t("Помилка запиту")); }
  }, [id, onRead, setTicketData, t]);
  useEffect(() => {
    if (ticket?.summary.unreadCount && lastMessageId && reading.current !== lastMessageId) void read(lastMessageId, ticket.summary.version);
  }, [lastMessageId, read, ticket?.summary.unreadCount, ticket?.summary.version]);
  useEffect(() => {
    if (ready) {
      heading.current?.focus({ preventScroll: true });
      if (window.matchMedia("(max-width: 800px)").matches)
        heading.current?.closest(".treba-admin-inbox-pane")?.scrollIntoView({ block: "start" });
    }
  }, [ready]);
  useEffect(() => {
    if (nearBottom.current && history.current) history.current.scrollTop = history.current.scrollHeight;
  }, [lastMessageId]);
  function changeDraft(next: Draft) { setDraft(next); drafts.current.set(id, next); }
  async function send() {
    if (!draft.text.trim() || sending.current || ticket?.summary.status === "CLOSED") return;
    sending.current = true;
    const next = { ...draft, clientMessageId: draft.clientMessageId || crypto.randomUUID() };
    changeDraft(next);
    const result = await action.run(`support/${id}/messages`, { message: next.text, internal: next.internal, clientMessageId: next.clientMessageId });
    if (result !== undefined) {
      changeDraft({ text: "", internal: next.internal, clientMessageId: "" });
      nearBottom.current = true;
      if (history.current) history.current.scrollTop = history.current.scrollHeight;
    }
    sending.current = false;
  }
  async function earlier() {
    const before = older[0]?.id ?? ticket?.messages[0]?.id;
    if (!before || loadingOlder) return;
    setLoadingOlder(true); action.setError("");
    const previousHeight = history.current?.scrollHeight ?? 0;
    const previousTop = history.current?.scrollTop ?? 0;
    try {
      const page = await adminRequest<{ messages: Message[]; hasMore: boolean }>(`support/${id}/messages?before=${before}`);
      setOlder(previous => mergeSupportMessages(page.messages, previous)); setHasMore(page.hasMore);
      requestAnimationFrame(() => { if (history.current) history.current.scrollTop = previousTop + history.current.scrollHeight - previousHeight; });
    } catch (error) { action.setError(error instanceof Error ? error.message : t("Помилка історії")); }
    finally { setLoadingOlder(false); }
  }
  return <>
    {resource.loading && <Loading />}
    <Alert message={resource.error} />
    {!ticket && resource.error && <Button icon="refresh" tone="secondary" onClick={() => void resource.reload()}>{t("Спробувати ще раз")}</Button>}
    {ticket && <>
      <header className="treba-admin-conversation-header">
        <span className="treba-admin-ticket-avatar">{ticket.summary.customerName.split(/\s+/).map(part => part[0]).slice(0, 2).join("")}</span>
        <div><h2 ref={heading} tabIndex={-1}>{ticket.summary.subject}</h2><p>{ticket.summary.customerName}<span>·</span>{label(ticket.summary.kind)}</p></div>
        <Badge value={ticket.summary.status} />
      </header>
      <div className="treba-admin-conversation-context">
        {ticket.summary.orderId && <Link href={`/admin/orders/${ticket.summary.orderId}`}><Icon name="bag" size={16} />{ticket.summary.orderNumber ?? t("Замовлення")}<Icon name="chevron" size={13} /></Link>}
        {ticket.summary.productName && <span><Icon name="box" size={16} />{ticket.summary.productName}</span>}
        <details><summary><Icon name="info" size={16} />{t("Деталі звернення")}</summary><dl>
          <div><dt>{t("Покупець")}</dt><dd>{ticket.summary.customerName}</dd></div>
          <div><dt>{t("Тип")}</dt><dd>{label(ticket.summary.kind)}</dd></div>
          <div><dt>{t("Оновлено")}</dt><dd>{date(ticket.summary.updatedAt)}</dd></div>
        </dl></details>
      </div>
      <div className="treba-admin-conversation-history" ref={history} role="log" aria-label={t("Історія повідомлень")} aria-live="polite"
        onScroll={event => { const node = event.currentTarget; nearBottom.current = node.scrollHeight - node.scrollTop - node.clientHeight < 80; }}>
        {ticket.hasEarlierMessages && hasMore && <Button tone="secondary" icon="clock" disabled={loadingOlder} onClick={() => void earlier()}>{t("Завантажити попередні повідомлення")}</Button>}
        {mergeSupportMessages(older, ticket.messages).map(message => {
          const event = supportStatusEvent(message.message);
          return event ? <div key={message.id} className="treba-admin-conversation-event"><Icon name="check" size={14} /><span>{message.authorName} · {label(event[0])} → {label(event[1])}</span><time dateTime={message.createdAt}>{date(message.createdAt)}</time></div> :
            <article key={message.id} className={`treba-admin-conversation-message ${message.internal ? "internal" : message.authorRole === "Customer" ? "customer" : "staff"}`}>
              <header><b>{message.authorName}</b><span>{label(message.authorRole)}</span></header>
              {message.internal && <small><Icon name="lock" size={13} />{t("Внутрішня нотатка · покупець не бачить")}</small>}
              <p>{message.message}</p><time dateTime={message.createdAt}>{date(message.createdAt)}</time>
            </article>;
        })}
        {!ticket.messages.length && <p className="treba-admin-note">{t("Повідомлень ще немає")}</p>}
      </div>
      <div className="treba-admin-conversation-controls">
        <Feedback action={action} /><Alert message={readError} />
        {readError && lastMessageId && <Button tone="secondary" icon="check" onClick={() => void read(lastMessageId, ticket.summary.version)}>{t("Позначити прочитаним")}</Button>}
        {ticket.summary.status === "CLOSED" ? <p className="treba-admin-conversation-closed"><Icon name="lock" size={18} />{t("Звернення закрито. Історія доступна для перегляду.")}</p> : <form className={draft.internal ? "treba-admin-composer internal" : "treba-admin-composer"}
          onSubmit={event => { event.preventDefault(); void send(); }}>
          <div className="treba-admin-composer-modes" role="group" aria-label={t("Режим повідомлення")}>
            <button type="button" aria-pressed={!draft.internal} disabled={action.busy} onClick={() => changeDraft({ ...draft, internal: false, clientMessageId: "" })}><Icon name="chat" size={16} />{t("Відповідь покупцю")}</button>
            {staff.role !== "Seller" && <button type="button" aria-pressed={draft.internal} disabled={action.busy} onClick={() => changeDraft({ ...draft, internal: true, clientMessageId: "" })}><Icon name="lock" size={16} />{t("Внутрішня нотатка")}</button>}
          </div>
          <label className="treba-admin-composer-label" htmlFor="support-message">{draft.internal ? t("Внутрішня нотатка · покупець не бачить") : t("Повідомлення покупцю")}</label>
          <textarea id="support-message" value={draft.text} disabled={action.busy} maxLength={4000} required
            placeholder={draft.internal ? t("Додайте нотатку для команди…") : t("Напишіть відповідь…")}
            onChange={event => changeDraft({ ...draft, text: event.target.value, clientMessageId: "" })} />
          <div className="treba-admin-composer-footer"><small>{draft.text.length} / 4000</small><Button type="submit" icon="arrow" disabled={!draft.text.trim() || action.busy}>{draft.internal ? t("Зберегти нотатку") : t("Надіслати")}</Button></div>
        </form>}
        <div className="treba-admin-conversation-decisions">
          {ticket.allowedStatuses.length > 0 && <div><select aria-label={t("Новий статус")} value={status} disabled={action.busy} onChange={event => setStatus(event.target.value)}>
            <option value="">{t("Змінити статус…")}</option>{ticket.allowedStatuses.map(value => <option key={value} value={value}>{label(value)}</option>)}
          </select><Button tone="secondary" icon="check" disabled={!status || action.busy} onClick={() => { action.setError(""); setConfirm("status"); }}>{t("Застосувати")}</Button></div>}
          {capabilities?.canDelete && <Button tone="danger" icon="trash" disabled={action.busy || (ticket.summary.kind === "RETURN" && ticket.summary.status !== "CLOSED")}
            onClick={() => { action.setError(""); setConfirm("trash"); }}>{t("До кошика")}</Button>}
        </div>
        {capabilities?.canDelete && ticket.summary.kind === "RETURN" && ticket.summary.status !== "CLOSED" && <p className="treba-admin-note">{t("Спочатку завершіть обробку повернення.")}</p>}
      </div>
      {confirm && <Confirm title={confirm === "trash" ? t("Перемістити чат у кошик?") : t("Підтвердити зміну статусу?")}
        confirmLabel={confirm === "trash" ? t("До кошика") : t("Змінити статус")} confirmIcon={confirm === "trash" ? "trash" : "check"} busy={action.busy} error={action.error} onClose={() => setConfirm(null)}
        onConfirm={() => void action.run(`support/${id}${confirm === "status" ? "/status" : ""}`,
          confirm === "status" ? { status, expectedVersion: ticket.summary.version } : { expectedVersion: ticket.summary.version }, confirm === "status" ? "PATCH" : "DELETE").then(result => {
            if (result !== undefined) { if (confirm === "trash") { drafts.current.delete(id); onRemoved(); } else setStatus(""); setConfirm(null); }
          })}>
        <p>{confirm === "trash" ? ticket.summary.subject : label(status)}</p>
        {confirm === "trash" && <p>{t("Чат зникне з активної черги та кабінету покупця. Історія зберігається.")}</p>}
        {confirm === "status" && ticket.summary.kind === "RETURN" && status === "CLOSED" && ticket.summary.status === "APPROVED" && <p className="treba-admin-note">{t("Ви підтверджуєте фактичне отримання всіх повернутих товарів, придатних до продажу. Залишки буде відновлено. Це не виконує грошовий переказ покупцю.")}</p>}
      </Confirm>}
    </>}
  </>;
}

"use client";
import { FormEvent, Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import AccountPageShell from "../../../components/account/AccountPageShell";
import PageTitle from "../../../components/account/PageTitle";
import { useAuth } from "../../../context/AuthContext";
import { support, SupportError, type Conversation, type ConversationDetails, type ConversationPage, type Message } from "../../../lib/api/support";
import styles from "./page.module.css";

const kindLabel = { CHAT: "Особиста підтримка", QUESTION: "Питання про товар або замовлення", RETURN: "Повернення" };
const statusLabel: Record<string, string> = { OPEN: "Очікує відповіді", IN_PROGRESS: "У роботі", APPROVED: "Схвалено", REJECTED: "Відхилено", CLOSED: "Завершено" };
function mergeMessages(older: Message[], newer: Message[]) {
  const messages = new Map(older.map(message => [message.id, message]));
  for (const message of newer) messages.set(message.id, message);
  return [...messages.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id));
}
function Inbox() {
  const { user } = useAuth();
  const userId = user?.id;
  const router = useRouter();
  const params = useSearchParams();
  const productId = params.get("product");
  const productSlug = params.get("slug");
  const orderId = productId ? null : params.get("order");
  const title = productId || orderId ? (params.get("title") ?? (productId ? "Питання про товар" : "Питання про замовлення")).slice(0, 190) : "Чат з TREBA";
  const requestedId = params.get("ticket");
  const startNew = params.get("new") === "chat" || !!productId || !!orderId;
  const [threads, setThreads] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(requestedId);
  const [details, setDetails] = useState<ConversationDetails | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [olderBusy, setOlderBusy] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const end = useRef<HTMLDivElement>(null);
  const pending = useRef<{ id: string; text: string; target: string } | null>(null);
  const lastRead = useRef("");
  const loadedPages = useRef(1);
  const threadRevision = useRef(0);
  const moreBusy = useRef(false);
  const refreshThreads = useCallback(async () => {
    const revision = threadRevision.current;
    const result = await support<ConversationPage>();
    const lastPage = Math.min(loadedPages.current, Math.max(1, result.totalPages));
    const pages = [result];
    for (let first = 2; first <= lastPage; first += 4) {
      pages.push(...await Promise.all(Array.from({ length: Math.min(4, lastPage - first + 1) }, (_, index) => support<ConversationPage>("?page=" + (first + index)))));
    }
    if (revision !== threadRevision.current) return;
    // Replace the loaded pages so deleted conversations cannot survive in the previous client snapshot.
    setThreads([...new Map(pages.flatMap(page => page.content).map(thread => [thread.id, thread])).values()]);
    loadedPages.current = lastPage; setPage(lastPage);
    setTotalPages(result.totalPages);
  }, []);
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    void (async () => {
      const result = await support<ConversationPage>();
      if (!alive) return;
      setError("");
      setThreads(result.content); loadedPages.current = 1; threadRevision.current++; setPage(1); setTotalPages(result.totalPages);
      if (!requestedId && startNew) {
        const query = new URLSearchParams({ kind: productId || orderId ? "QUESTION" : "CHAT", view: "open" });
        if (productId) query.set("productId", productId);
        if (orderId) query.set("orderId", orderId);
        const existing = await support<ConversationPage>("?" + query);
        if (alive) setActiveId(existing.content[0]?.id ?? null);
      } else if (!requestedId) setActiveId(result.content[0]?.id ?? null);
    })().catch(error => { if (alive) setError(error.message); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [userId, requestedId, productId, orderId, startNew]);
  useEffect(() => {
    if (!userId) return;
    let alive = true, running = false;
    async function refresh() {
      if (running || document.visibilityState !== "visible") return;
      running = true;
      try {
        await refreshThreads();
        if (activeId) {
          const next = await support<ConversationDetails>("/" + activeId);
          if (!alive) return;
          setDetails(previous => previous?.summary.id === activeId ? { ...next, messages: mergeMessages(previous.messages, next.messages), hasEarlierMessages: previous.hasEarlierMessages } : next);
          const messageId = next.messages.at(-1)?.id;
          if (messageId && lastRead.current !== messageId) { await support(`/${activeId}/read`, { messageId }); lastRead.current = messageId; }
        }
        if (alive) setError("");
      } catch (error) {
        if (!alive) return;
        if (error instanceof SupportError && error.status === 404 && activeId) {
          setThreads(previous => previous.filter(thread => thread.id !== activeId));
          setDetails(null); setActiveId(null); setDraft(""); pending.current = null;
          router.replace("/account/messages", { scroll: false });
        }
        setError(error instanceof Error ? error.message : "Помилка з’єднання");
      }
      finally { running = false; }
    }
    void refresh();
    const timer = window.setInterval(refresh, 5000);
    document.addEventListener("visibilitychange", refresh);
    return () => { alive = false; clearInterval(timer); document.removeEventListener("visibilitychange", refresh); };
  }, [userId, activeId, refreshThreads, router]);
  const latestId = details?.messages.at(-1)?.id;
  useEffect(() => { end.current?.scrollIntoView({ block: "nearest" }); }, [latestId]);
  function choose(id: string) { setDetails(null); setDraft(""); setActiveId(id); router.replace("/account/messages?ticket=" + id, { scroll: false }); }
  async function send(event: FormEvent) {
    event.preventDefault(); if (!draft.trim() || sending) return;
    const text = draft.trim(), target = activeId ?? productId ?? orderId ?? "chat";
    if (pending.current?.text !== text || pending.current.target !== target) pending.current = { id: crypto.randomUUID(), text, target };
    setSending(true); setError("");
    try {
      if (activeId) await support(`/${activeId}/messages`, { message: text, clientMessageId: pending.current.id });
      else {
        const created = await support<ConversationDetails>("", { kind: productId || orderId ? "QUESTION" : "CHAT", productId, orderId, subject: title, message: text, clientRequestId: pending.current.id });
        setActiveId(created.summary.id); setDetails(created);
        router.replace("/account/messages?ticket=" + created.summary.id, { scroll: false });
      }
      setDraft(""); pending.current = null;
      if (activeId) setDetails(await support<ConversationDetails>("/" + activeId));
      await refreshThreads();
    } catch (error) { setError(error instanceof Error ? error.message : "Не вдалося надіслати повідомлення"); }
    finally { setSending(false); }
  }
  async function earlier() {
    if (!details?.messages.length || !activeId || olderBusy) return;
    setOlderBusy(true);
    try {
      const result = await support<{ messages: Message[]; hasMore: boolean }>(`/${activeId}/messages?before=${details.messages[0].id}`);
      setDetails(previous => previous ? { ...previous, messages: mergeMessages(result.messages, previous.messages), hasEarlierMessages: result.hasMore } : previous);
    } catch (error) { setError(error instanceof Error ? error.message : "Не вдалося завантажити історію"); }
    finally { setOlderBusy(false); }
  }
  async function moreThreads() {
    if (moreBusy.current) return;
    moreBusy.current = true; threadRevision.current++;
    try { const result = await support<ConversationPage>("?page=" + (loadedPages.current + 1)); threadRevision.current++; loadedPages.current = result.page; setThreads(previous => [...new Map([...previous, ...result.content].map(item => [item.id, item])).values()]); setPage(result.page); setTotalPages(result.totalPages); }
    catch (error) { setError(error instanceof Error ? error.message : "Не вдалося завантажити переписки"); }
    finally { moreBusy.current = false; }
  }
  const current = details?.summary;
  return <AccountPageShell><PageTitle>Повідомлення та підтримка</PageTitle>
    <p className={styles.intro}>У чаті з TREBA відповідає команда підтримки. На питання про товар — лише його продавець. Кожна переписка приватна.</p>
    {error && <div className={styles.error} role="alert">{error} <button onClick={() => window.location.reload()}>Оновити</button></div>}
    <div className={styles.chatWrap}>
      <aside className={styles.threadList} aria-label="Ваші переписки">
        <Link className={styles.newChat} href="/account/messages?new=chat">＋ Написати в TREBA</Link>
        {loading && <p className={styles.empty}>Завантажуємо переписки…</p>}
        {!loading && threads.length === 0 && <p className={styles.empty}>Тут зберігатимуться ваші звернення та відповіді.</p>}
        {threads.map(thread => <button key={thread.id} type="button" className={`${styles.threadItem} ${thread.id === activeId ? styles.selected : ""}`} onClick={() => choose(thread.id)} aria-current={thread.id === activeId ? "true" : undefined}>
          <span className={styles.kind}>{thread.productId ? "Питання продавцю" : kindLabel[thread.kind]}</span><strong>{thread.subject}</strong>
          <span className={styles.preview}>{thread.lastMessage}</span><span className={styles.threadMeta}><time>{new Date(thread.updatedAt).toLocaleDateString("uk-UA")}</time>{thread.unreadCount > 0 && <b className={styles.badge} aria-label={`${thread.unreadCount} непрочитаних`}>{thread.unreadCount}</b>}</span>
        </button>)}
        {page < totalPages && <button className={styles.more} onClick={moreThreads}>Ще переписки</button>}
      </aside>
      <section className={styles.chatPanel} aria-label={current?.productId || productId ? "Переписка з продавцем" : "Переписка з підтримкою"}>
        <header className={styles.chatHeader}><span className={styles.avatar}>{current?.productId || productId ? "П" : "T"}</span><div><h2>{current?.subject ?? title}</h2><p>{current?.productId || productId ? "Продавець товару" : "Підтримка TREBA"} · {current ? statusLabel[current.status] : "Відповідь з’явиться тут"}</p>
          {(current?.productSlug ?? productSlug) && <Link href={`/product/${encodeURIComponent(current?.productSlug ?? productSlug ?? "")}`}>{current?.productName ?? "Перейти до товару"} ↗</Link>}
          {current?.orderNumber && <span>Замовлення {current.orderNumber}</span>}</div></header>
        <div className={styles.messages} role="log" aria-live="polite" aria-label="Історія повідомлень">
          {activeId && !details && <p className={styles.empty}>Завантажуємо повідомлення…</p>}
          {!activeId && <div className={styles.welcome}><span>✉</span><h3>{productId ? "Запитайте про товар" : "Чим можемо допомогти?"}</h3><p>{productId ? "Опишіть своє питання. Продавець товару відповість у цій переписці." : "Опишіть своє питання. Команда TREBA відповість у цій переписці."}</p></div>}
          {details?.hasEarlierMessages && <button className={styles.more} disabled={olderBusy} onClick={earlier}>Попередні повідомлення</button>}
          {details?.messages.map(message => <article key={message.id} className={`${styles.bubble} ${message.authorRole === "Customer" ? styles.own : styles.staff}`}>
            <strong>{message.authorRole === "Customer" ? "Ви" : message.authorRole === "Seller" ? "Продавець товару" : "Підтримка TREBA"}</strong><p>{message.message}</p><time dateTime={message.createdAt}>{new Date(message.createdAt).toLocaleString("uk-UA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</time>
          </article>)}<div ref={end} />
        </div>
        {current?.status === "CLOSED" ? <div className={styles.closed}>Переписку завершено. <Link href="/account/messages?new=chat">Створити нове звернення</Link></div>
          : <form className={styles.composer} onSubmit={send}><label htmlFor="support-message" className={styles.srOnly}>Ваше повідомлення</label><textarea id="support-message" placeholder="Напишіть повідомлення…" maxLength={4000} value={draft} onChange={event => setDraft(event.target.value)} rows={3} disabled={sending || !!activeId && !details} /><div><small>{draft.length}/4000 · Оновлюється автоматично</small><button disabled={sending || !draft.trim() || !!activeId && !details}>{sending ? "Надсилаємо…" : "Надіслати →"}</button></div></form>}
      </section>
    </div>
  </AccountPageShell>;
}
function MessagesRoute() { const params = useSearchParams(); return <Inbox key={params.toString()} />; }
export default function MessagesPage() { return <Suspense fallback={<p>Завантаження…</p>}><MessagesRoute /></Suspense>; }

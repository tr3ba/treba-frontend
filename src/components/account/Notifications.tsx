"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { accountRequest, type Notification, type NotificationFeed } from "../../lib/api/account";
import { notificationHref } from "../../lib/notifications";
import { formatDateTime } from "../../lib/format";
import styles from "./Notifications.module.css";

export default function Notifications({ fullPage = false }: { fullPage?: boolean }) {
  const { user } = useAuth(); const [feed, setFeed] = useState<NotificationFeed>({ items: [], unreadCount: 0 });
  const userId = user?.id;
  const [open, setOpen] = useState(false); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false); const [reload, setReload] = useState(0); const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    const load = () => accountRequest<NotificationFeed>("notifications", { signal: controller.signal }).then(data => { setFeed(data); setError(""); }).catch(error => { if (!controller.signal.aborted) setError(error.message); });
    void load(); const timer = setInterval(() => { if (document.visibilityState === "visible") void load(); }, 30000);
    const focus = () => void load(); window.addEventListener("focus", focus);
    return () => { controller.abort(); clearInterval(timer); window.removeEventListener("focus", focus); };
  }, [userId, reload]);
  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", close); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", close); document.removeEventListener("keydown", escape); };
  }, [open]);
  async function mark(keys: string[]) {
    await accountRequest("notifications/read", { method: "POST", body: { keys } });
    setFeed(previous => { const read = new Set(keys); const items = previous.items.map(item => read.has(item.key) ? { ...item, read: true } : item); return { items, unreadCount: items.filter(item => !item.read).length }; });
    window.dispatchEvent(new Event("treba-notifications-read"));
  }
  useEffect(() => { const changed = () => setReload(x => x + 1); window.addEventListener("treba-notifications-read", changed); return () => window.removeEventListener("treba-notifications-read", changed); }, []);
  async function readAll() { if (busy) return; setBusy(true); try { await mark(feed.items.filter(item => !item.read).map(item => item.key)); } catch (error) { setError(error instanceof Error ? error.message : "Не вдалося зберегти."); } finally { setBusy(false); } }
  async function navigate(event: React.MouseEvent, item: Notification) {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); if (busy) return; setBusy(true);
    try { if (!item.read) await mark([item.key]); window.location.assign(notificationHref(item)); }
    catch (error) { setError(error instanceof Error ? error.message : "Не вдалося відкрити сповіщення."); }
    finally { setBusy(false); }
  }
  if (!user) return null;
  const items = feed.items.filter(item => !unreadOnly || !item.read);
  return <div className={styles.root} ref={root}>
    {!fullPage && <button className={styles.bell} aria-label={`Сповіщення: ${feed.unreadCount} непрочитаних`} aria-expanded={open} onClick={() => setOpen(value => !value)}><svg width="25" height="25" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>{feed.unreadCount > 0 && <span>{feed.unreadCount}</span>}</button>}
    {(fullPage || open) && <section className={fullPage ? styles.full : styles.popover} aria-label="Сповіщення">
      <div className={styles.heading}><h2>Сповіщення</h2><button disabled={busy || !feed.unreadCount} onClick={readAll}>Прочитати всі</button></div>
      <p className={styles.muted}>Останні події за 30 днів</p>
      {fullPage && <label className={styles.filter}><input type="checkbox" checked={unreadOnly} onChange={e => setUnreadOnly(e.target.checked)} /> Лише непрочитані</label>}
      {error && <p role="alert">{error} <button onClick={() => setReload(value => value + 1)}>Повторити</button></p>}
      {!items.length && !error && <p className={styles.empty}>Нових сповіщень немає</p>}
      {(fullPage ? items : items.slice(0, 8)).map(item => <a className={`${styles.item} ${!item.read ? styles.unread : ""}`} key={item.key} href={notificationHref(item)} onClick={event => void navigate(event, item)}>
        <span className={styles.icon} aria-hidden="true">{item.kind === "order" || item.kind === "order-status" ? "▣" : item.kind === "moderation" ? "✓" : item.kind === "application" ? "▤" : "✉"}</span><div><strong>{item.title}</strong><p>{item.text}</p><time>{formatDateTime(item.createdAt)}</time></div>{!item.read && <span className={styles.dot} aria-label="Не прочитано" />}
      </a>)}
      {!fullPage && <Link className={styles.footer} href="/account/notifications" onClick={() => setOpen(false)}>Усі сповіщення →</Link>}
    </section>}
  </div>;
}

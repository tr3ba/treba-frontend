"use client";

import { useEffect, useState } from "react";
import AccountPageShell from "./AccountPageShell";
import PageTitle from "./PageTitle";
import { accountRequest } from "../../lib/api/account";
import { useAuth } from "../../context/AuthContext";
import styles from "../../app/account/subscriptions/page.module.css";

type Settings = { ordersEmail: boolean; ordersTelegram: boolean; supportEmail: boolean; supportTelegram: boolean; version: string; emailAvailable: boolean; telegramAvailable: boolean };
type LinkStatus = { configured: boolean; linked: boolean; username?: string; telegramUserId?: number; pendingId?: string; pendingTelegramName?: string; pendingUsername?: string };
type LinkStart = { botUrl: string; expiresAt: string };
const fields = [
  ["ordersEmail", "Замовлення — email", "Підтвердження, оплата та зміни статусу замовлення."],
  ["ordersTelegram", "Замовлення — Telegram", "Повідомлення про замовлення у підключений особистий чат з ботом."],
  ["supportEmail", "Відповіді підтримки — email", "Сповіщення про нову відповідь без тексту приватної переписки."],
  ["supportTelegram", "Відповіді підтримки — Telegram", "Посилання на переписку у вашому акаунті TREBA."],
] as const;

async function telegramRequest<T>(path: string, method = "GET", body?: unknown, signal?: AbortSignal): Promise<T> {
  const response = await fetch("/shop-api/telegram/" + path, { method, signal, cache: "no-store",
    ...(body === undefined ? {} : { headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }) });
  if (response.status === 204) return undefined as T;
  const result = await response.json();
  if (!response.ok) throw new Error(result.title ?? result.message ?? "Не вдалося підключити Telegram.");
  return result as T;
}

export default function NotificationSubscriptions() {
  const { user } = useAuth(); const userId = user?.id;
  const [settings, setSettings] = useState<Settings | null>(null); const [link, setLink] = useState<LinkStatus | null>(null);
  const [start, setStart] = useState<LinkStart | null>(null); const [error, setError] = useState("");
  const [saved, setSaved] = useState(false); const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    Promise.all([accountRequest<Settings>("notification-settings", { signal: controller.signal }), telegramRequest<LinkStatus>("link", "GET", undefined, controller.signal)])
      .then(([s, l]) => { setSettings(s); setLink(l); }).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    return () => controller.abort();
  }, [userId]);
  useEffect(() => {
    if (!start || !userId) return;
    const controller = new AbortController();
    const timer = setInterval(() => {
      if (Date.parse(start.expiresAt) <= Date.now()) { setStart(null); setError("Посилання застаріло. Створіть нове підключення."); return; }
      if (document.visibilityState === "visible") telegramRequest<LinkStatus>("link", "GET", undefined, controller.signal).then(setLink).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    }, 3000);
    return () => { clearInterval(timer); controller.abort(); };
  }, [start, userId]);
  async function changeLink(action: "begin" | "confirm" | "unlink") {
    if (busy) return;
    setBusy(true); setError("");
    try {
      if (action === "begin") setStart(await telegramRequest<LinkStart>("link", "POST", {}));
      else {
        if (action === "unlink") await telegramRequest("link", "DELETE");
        else await telegramRequest("link/confirm", "POST", { challengeId: link?.pendingId });
        setStart(null); setLink(await telegramRequest<LinkStatus>("link"));
        const fresh = await accountRequest<Settings>("notification-settings");
        setSettings(previous => previous ? { ...previous, emailAvailable: fresh.emailAvailable, telegramAvailable: fresh.telegramAvailable } : fresh);
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Не вдалося змінити підключення."); }
    finally { setBusy(false); }
  }
  async function save() {
    if (!settings || busy) return;
    setBusy(true); setError(""); setSaved(false);
    try {
      const { ordersEmail, ordersTelegram, supportEmail, supportTelegram, version } = settings;
      setSettings(await accountRequest<Settings>("notification-settings", { method: "PUT", body: { ordersEmail, ordersTelegram, supportEmail, supportTelegram, version } })); setSaved(true);
    } catch (e) { setError(e instanceof Error ? e.message : "Не вдалося зберегти налаштування."); }
    finally { setBusy(false); }
  }
  return <AccountPageShell><PageTitle>Підписки та сповіщення</PageTitle>
    {error && <p role="alert">{error} <button type="button" onClick={() => window.location.reload()}>Оновити сторінку</button></p>}
    {!settings ? <p role="status">Завантажуємо налаштування…</p> : <div className={styles.card}>
      <div className={styles.column}><h2 className={styles.columnTitle}>Сповіщення про покупки та підтримку</h2>
        <p className={styles.toggleDescription}>Увімкніть потрібні канали. Налаштування зберігаються у вашому акаунті. Сповіщення всередині TREBA залишаються доступними.</p>
        {fields.map(([key, label, description]) => <label key={key} className={styles.toggleRow}><input type="checkbox" className={styles.checkbox} disabled={busy} checked={settings[key]} onChange={e => { setSaved(false); setSettings({ ...settings, [key]: e.target.checked }); }} /><span><span className={styles.toggleLabel}>{label}</span><span className={styles.toggleDescription}>{description}</span></span></label>)}
        {!settings.emailAvailable && <p className={styles.toggleDescription}>Email-доставка ще не налаштована або адресу акаунта не підтверджено. Ваш вибір можна зберегти заздалегідь.</p>}
        {!settings.telegramAvailable && <p className={styles.toggleDescription}>Для Telegram потрібні активний бот і підключений особистий акаунт.</p>}
        <button type="button" className={styles.action} disabled={busy} onClick={save}>{busy ? "Зберігаємо…" : "Зберегти налаштування"}</button>{saved && <p role="status">Налаштування збережено.</p>}
      </div>
      <div className={styles.column}><h2 className={styles.columnTitle}>Telegram</h2>
        {!link?.configured ? <p>Адміністратор ще не налаштував бота.</p> : link.linked ? <><p>Підключено: {link.username ? "@" + link.username : link.telegramUserId}</p><button type="button" className={styles.action} disabled={busy} onClick={() => { if (window.confirm("Відключити Telegram від вашого акаунта TREBA?")) void changeLink("unlink"); }}>Відключити Telegram</button></> : link.pendingId ? <><p>Підтвердьте акаунт: <strong>{link.pendingTelegramName} {link.pendingUsername && "@" + link.pendingUsername}</strong></p><button type="button" className={styles.action} disabled={busy} onClick={() => changeLink("confirm")}>Підтвердити підключення</button></> : start ? <><a className={styles.action} href={start.botUrl} target="_blank" rel="noopener noreferrer">Відкрити бота TREBA</a><p role="status">Натисніть Start у боті, поверніться сюди та підтвердьте підключення.</p></> : <button type="button" className={styles.action} disabled={busy} onClick={() => changeLink("begin")}>Підключити Telegram</button>}
      </div>
    </div>}
  </AccountPageShell>;
}

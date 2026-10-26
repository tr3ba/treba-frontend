"use client";

import { useEffect, useState } from "react";
import { deliveryRequest, type DeliveryCity, type DeliveryPoint, type DeliveryQuote } from "../../lib/api/delivery";
import type { CartItem } from "../../types/cart";
import styles from "./CheckoutForm.module.css";

export default function NovaPoshtaDelivery({ items, onQuote }: { items: CartItem[]; onQuote: (quote: DeliveryQuote | null) => void }) {
  const [query, setQuery] = useState(""); const [cities, setCities] = useState<DeliveryCity[]>([]);
  const [city, setCity] = useState<DeliveryCity | null>(null); const [points, setPoints] = useState<DeliveryPoint[]>([]);
  const [point, setPoint] = useState(""); const [pointQuery, setPointQuery] = useState(""); const [kind, setKind] = useState("all");
  const [page, setPage] = useState(1); const [hasMore, setHasMore] = useState(false);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const fingerprint = JSON.stringify(items.map(i => ({ variantId: i.variantId, quantity: i.quantity })));

  useEffect(() => {
    if (city || query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      deliveryRequest<DeliveryCity[]>("cities?query=" + encodeURIComponent(query.trim()), undefined, controller.signal)
        .then(data => { setCities(data); setError(data.length ? "" : "Місто не знайдено. Спробуйте уточнити назву."); })
        .catch(e => { if (!controller.signal.aborted) setError(e.message); });
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, city]);

  useEffect(() => {
    if (!city) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setPointsLoading(true);
      // Filter locally so pagination remains based on the carrier's unfiltered pages.
      deliveryRequest<{ items: DeliveryPoint[]; hasMore: boolean }>(`pickup-points?cityRef=${city.ref}&query=${encodeURIComponent(pointQuery)}&page=${page}`, undefined, controller.signal)
        .then(data => { setPoints(previous => page === 1 ? data.items : [...previous, ...data.items]); setHasMore(data.hasMore); setError(""); })
        .catch(e => { if (!controller.signal.aborted) setError(e.message); })
        .finally(() => { if (!controller.signal.aborted) setPointsLoading(false); });
    }, 300);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [city, pointQuery, page]);

  useEffect(() => {
    onQuote(null);
    if (!city || !point) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setBusy(true); setError("");
      deliveryRequest<DeliveryQuote>("quotes", { cityRef: city.ref, pickupPointRef: point, items: JSON.parse(fingerprint) }, controller.signal)
        .then(quote => { if (!controller.signal.aborted) onQuote(quote); }).catch(e => { if (!controller.signal.aborted) setError(e.message); })
        .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    }, 150);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [city, point, fingerprint, onQuote, retry]);

  return <div>
    <div className={styles.field}><label className={styles.label} htmlFor="np-city">Місто</label>
      <input id="np-city" className={styles.input} value={query} autoComplete="off" maxLength={100} onChange={e => { setQuery(e.target.value); setCity(null); setCities([]); setPoints([]); setPoint(""); setPage(1); onQuote(null); }} />
      {!city && cities.length > 0 && <ul aria-label="Знайдені міста">{cities.map(c => <li key={c.ref}><button type="button" className={styles.input} onClick={() => { setCity(c); setQuery(c.name); setCities([]); setPointQuery(""); setPoint(""); setPage(1); }}>{c.name}, {c.area}</button></li>)}</ul>}
    </div>
    {city && <>
      <div className={styles.grid}><label className={styles.field}><span className={styles.label}>Тип пункту</span><select className={styles.input} value={kind} onChange={e => { setKind(e.target.value); setPoint(""); onQuote(null); }}><option value="all">Усі</option><option value="branch">Відділення</option><option value="postomat">Поштомати</option></select></label>
        <label className={styles.field}><span className={styles.label}>Пошук за номером або адресою</span><input className={styles.input} value={pointQuery} maxLength={100} onChange={e => { setPointQuery(e.target.value); setPoint(""); setPoints([]); setPage(1); onQuote(null); }} /></label></div>
      <label className={styles.field}><span className={styles.label}>Відділення / поштомат</span><select className={styles.input} value={point} onChange={e => { setPoint(e.target.value); onQuote(null); }}><option value="">Виберіть пункт доставки</option>{points.filter(p => kind === "all" || p.postomat === (kind === "postomat")).map(p => <option key={p.ref} value={p.ref}>{p.name}</option>)}</select></label>
      {hasMore && <button type="button" className={styles.input} disabled={pointsLoading} onClick={() => { setPointsLoading(true); setPage(p => p + 1); }}>Завантажити ще відділення</button>}
      {pointsLoading && <p role="status">Завантажуємо відділення…</p>}
    </>}
    {city && point && <button type="button" className={styles.input} disabled={busy} onClick={() => setRetry(n => n + 1)}>Оновити розрахунок доставки</button>}
    {busy && city && point && <p role="status">Розраховуємо вартість доставки…</p>}
    {error && <p role="alert" className={styles.error}>{error}</p>}
  </div>;
}

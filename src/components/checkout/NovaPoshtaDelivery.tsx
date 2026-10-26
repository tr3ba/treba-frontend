"use client";

import { useEffect, useState } from "react";
import { deliveryRequest, type DeliveryCity, type DeliveryPoint, type DeliveryQuote } from "../../lib/api/delivery";
import type { CartItem } from "../../types/cart";
import DeliveryCombobox from "./DeliveryCombobox";
import styles from "./CheckoutForm.module.css";

export default function NovaPoshtaDelivery({ items, onQuote }: { items: CartItem[]; onQuote: (quote: DeliveryQuote | null) => void }) {
  const [query, setQuery] = useState("");
  const [cities, setCities] = useState<DeliveryCity[]>([]);
  const [city, setCity] = useState<DeliveryCity | null>(null);
  const [cityLoading, setCityLoading] = useState(false);
  const [cityError, setCityError] = useState("");
  const [cityRetry, setCityRetry] = useState(0);
  const [points, setPoints] = useState<DeliveryPoint[]>([]);
  const [point, setPoint] = useState<DeliveryPoint | null>(null);
  const [pointQuery, setPointQuery] = useState("");
  const [kind, setKind] = useState("branch");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [pointsLoading, setPointsLoading] = useState(false);
  const [pointError, setPointError] = useState("");
  const [pointRetry, setPointRetry] = useState(0);
  const [quoteRetry, setQuoteRetry] = useState(0);
  const [quoteError, setQuoteError] = useState("");
  const [busy, setBusy] = useState(false);
  const fingerprint = JSON.stringify(items.map(item => ({ variantId: item.variantId, quantity: item.quantity })));

  useEffect(() => {
    if (city || query.trim().length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      deliveryRequest<DeliveryCity[]>("cities?query=" + encodeURIComponent(query.trim()), undefined, controller.signal)
        .then(data => { if (!controller.signal.aborted) { setCities(data.slice(0, 20)); setCityError(""); } })
        .catch(error => { if (!controller.signal.aborted) setCityError(error.message); })
        .finally(() => { if (!controller.signal.aborted) setCityLoading(false); });
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [query, city, cityRetry]);

  useEffect(() => {
    if (!city) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      deliveryRequest<{ items: DeliveryPoint[]; hasMore: boolean }>(
        `pickup-points?cityRef=${city.ref}&query=${encodeURIComponent(pointQuery.trim())}&kind=${kind}&page=${page}`,
        undefined, controller.signal)
        .then(data => {
          if (controller.signal.aborted) return;
          setPoints(previous => [...new Map((page === 1 ? data.items : [...previous, ...data.items]).map(item => [item.ref, item])).values()]);
          setHasMore(data.hasMore); setPointError("");
        })
        .catch(error => { if (!controller.signal.aborted) setPointError(error.message); })
        .finally(() => { if (!controller.signal.aborted) setPointsLoading(false); });
    }, pointQuery.trim() ? 250 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [city, pointQuery, kind, page, pointRetry]);

  useEffect(() => {
    onQuote(null);
    if (!city || !point) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setBusy(true); setQuoteError("");
      deliveryRequest<DeliveryQuote>("quotes", { cityRef: city.ref, pickupPointRef: point.ref, items: JSON.parse(fingerprint) }, controller.signal)
        .then(quote => { if (!controller.signal.aborted) onQuote(quote); })
        .catch(error => { if (!controller.signal.aborted) setQuoteError(error.message); })
        .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    }, 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [city, point, fingerprint, onQuote, quoteRetry]);

  function clearPoint() {
    setPoint(null); setPointError(""); setQuoteError(""); setBusy(false); onQuote(null);
  }

  function changeCity(value: string) {
    setQuery(value); setCity(null); setCities([]); setCityError(""); setCityLoading(value.trim().length >= 2);
    setPoints([]); setPointQuery(""); setPage(1); setHasMore(false); setPointsLoading(false); clearPoint();
  }

  function changePointQuery(value: string) {
    setPointQuery(value); setPoints([]); setPage(1); setHasMore(false); setPointsLoading(true); clearPoint();
    setPointRetry(current => current + 1);
  }

  return <div className={styles.deliveryFields}>
    <DeliveryCombobox id="np-city" label="Місто або населений пункт" value={query} placeholder="Почніть вводити назву"
      selectedId={city?.ref} loading={cityLoading} error={cityError}
      hint={city ? `${city.area} область` : "Введіть щонайменше 2 символи та виберіть населений пункт зі списку."}
      emptyMessage={query.trim().length < 2 ? "Введіть щонайменше 2 символи" : "Нічого не знайдено. Перевірте назву населеного пункту."}
      options={cities.map(item => ({ id: item.ref, label: item.name, description: `${item.area} область` }))}
      onChange={changeCity} onRetry={() => { setCityLoading(true); setCityError(""); setCityRetry(value => value + 1); }}
      onSelect={id => {
        const selected = cities.find(item => item.ref === id);
        if (!selected || selected.ref === city?.ref) return;
        setCity(selected); setQuery(selected.name); setCityLoading(false); setCityError("");
        setPointQuery(""); setPoints([]); setPage(1); setHasMore(false); setPointsLoading(true); clearPoint();
      }} />
    {city && <>
      <div className={styles.pickupTypes} role="group" aria-label="Тип пункту доставки">
        {[{ id: "branch", label: "Відділення" }, { id: "postomat", label: "Поштомат" }].map(type =>
          <button key={type.id} type="button" aria-pressed={kind === type.id} onClick={() => {
            if (kind === type.id) return;
            setKind(type.id); setPointQuery(""); setPoints([]); setPage(1); setHasMore(false); setPointsLoading(true); clearPoint();
          }}>{type.label}</button>)}
      </div>
      <DeliveryCombobox id="np-pickup" label={kind === "postomat" ? "Поштомат" : "Відділення"}
        value={point?.name ?? pointQuery} placeholder="Знайти за номером або адресою" selectedId={point?.ref}
        loading={pointsLoading} error={pointError} hint={point ? "Пункт доставки вибрано." : "Виберіть зі списку або введіть номер чи вулицю."}
        emptyMessage="Пунктів доставки не знайдено. Спробуйте інший номер або адресу."
        options={points.map(item => {
          const colon = item.name.indexOf(":");
          return { id: item.ref, label: colon >= 0 ? item.name.slice(0, colon) : item.name,
            description: colon >= 0 ? item.name.slice(colon + 1).trim() : undefined };
        })}
        onChange={changePointQuery} hasMore={hasMore}
        onLoadMore={() => { if (!pointsLoading) { setPointsLoading(true); setPage(value => value + 1); } }}
        onRetry={() => { setPointsLoading(true); setPointError(""); setPointRetry(value => value + 1); }}
        onSelect={id => { const selected = points.find(item => item.ref === id); if (selected) { setPoint(selected); setQuoteError(""); setBusy(true); onQuote(null); } }} />
    </>}
    {busy && <p className={styles.deliveryStatus} role="status">Розраховуємо вартість доставки…</p>}
    {quoteError && <p className={styles.error} role="alert">{quoteError}</p>}
    {point && !busy && <button type="button" className={styles.recalculate} onClick={() => { setBusy(true); setQuoteError(""); setQuoteRetry(value => value + 1); }}>Перерахувати вартість доставки</button>}
  </div>;
}

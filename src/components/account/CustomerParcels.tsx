"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { accountRequest, type CustomerOrder, type Page } from "../../lib/api/account";
import { getOrderStatusLabel } from "../../lib/api/orders";
import { deliveryCarrierLabel } from "../../lib/api/delivery";
import { useAuth } from "../../context/AuthContext";
import AccountPageShell from "./AccountPageShell";
import PageTitle from "./PageTitle";
import styles from "./AccountData.module.css";

export default function CustomerParcels() {
  const { user } = useAuth(); const userId = user?.id;
  const [query, setQuery] = useState(""); const [search, setSearch] = useState(""); const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState<Page<CustomerOrder> | null>(null); const [error, setError] = useState("");
  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    const load = () => accountRequest<Page<CustomerOrder>>(`shipments?page=${page}&search=${encodeURIComponent(search)}`, { signal: controller.signal })
      .then(value => { setData(value); setError(""); }).catch(e => { if (!controller.signal.aborted) setError(e.message); });
    void load();
    const timer = setInterval(() => { if (document.visibilityState === "visible") void load(); }, 30000);
    return () => { controller.abort(); clearInterval(timer); };
  }, [page, search, userId, revision]);
  return <AccountPageShell><PageTitle>Посилки</PageTitle>
    <section className={styles.card}>
      <form className={styles.parcelSearch} onSubmit={e => { e.preventDefault(); setData(null); setPage(1); setSearch(query.trim()); setRevision(r => r + 1); }}><label>Знайти відправлення або замовлення <input value={query} maxLength={200} onChange={e => setQuery(e.target.value)} placeholder="Номер відправлення або замовлення" /></label> <button type="submit">Знайти</button></form>
    </section>
    {error ? <p role="alert">{error}</p> : !data ? <p role="status">Завантажуємо посилки…</p> : data.content.length === 0 ? <section className={styles.card}>Відправлень не знайдено.</section> : <>
      {data.content.map(order => order.delivery && <article className={styles.card} key={order.id}><p className={styles.muted}>{deliveryCarrierLabel(order.delivery.carrier)}</p><h2 className={styles.reference}>{order.delivery.reference}</h2><span className={styles.badge}>{getOrderStatusLabel(order.status)}</span><p>{order.delivery.city}<br />{order.delivery.pickupPoint}</p><Link className={styles.link} href={`/account/orders/${order.id}`}>Історія руху та замовлення № {order.orderNumber}</Link></article>)}
      <nav aria-label="Сторінки посилок"><button type="button" disabled={page <= 1} onClick={() => { setData(null); setPage(p => p - 1); }}>Назад</button> <span>{page} / {data.totalPages}</span> <button type="button" disabled={page >= data.totalPages} onClick={() => { setData(null); setPage(p => p + 1); }}>Далі</button></nav>
    </>}
  </AccountPageShell>;
}

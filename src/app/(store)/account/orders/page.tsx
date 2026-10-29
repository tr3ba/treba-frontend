"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import AccountPageShell from "../../../../components/account/AccountPageShell";
import PageTitle from "../../../../components/account/PageTitle";
import { getCustomerOrders, type CustomerOrder, type Page } from "../../../../lib/api/account";
import { getOrderStatusLabel } from "../../../../lib/api/orders";
import { resolveMediaUrl } from "../../../../lib/api/client";
import { formatDate, formatPrice } from "../../../../lib/format";
import styles from "../../../../components/account/AccountData.module.css";

export default function OrdersPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const [result, setResult] = useState<Page<CustomerOrder> | null>(null);
  const [query, setQuery] = useState(""); const [days, setDays] = useState("all"); const [page, setPage] = useState(1);
  const [error, setError] = useState(""); const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!userId) return;
    let active = true;
    const load = () => getCustomerOrders(page, query, days === "all" ? undefined : new Date(Date.now() - Number(days) * 86400000).toISOString())
      .then(data => { if (active) { setResult(data); setError(""); } }).catch(error => { if (active) setError(error.message); });
    const debounce = setTimeout(() => void load(), 250);
    const refresh = setInterval(() => { if (document.visibilityState === "visible") void load(); }, 30000);
    return () => { active = false; clearTimeout(debounce); clearInterval(refresh); };
  }, [userId, page, query, days, revision]);
  return <AccountPageShell><PageTitle>Мої замовлення</PageTitle>
    <div className={styles.toolbar}>
      <input aria-label="Номер замовлення" placeholder="Пошук за номером" value={query} onChange={e => { setQuery(e.target.value); setPage(1); }} />
      <select aria-label="Період" value={days} onChange={e => { setDays(e.target.value); setPage(1); }}><option value="all">За весь час</option><option value="365">За рік</option><option value="30">За місяць</option></select>
      <button onClick={() => setRevision(x => x + 1)}>Оновити</button>
    </div>
    {error ? <div className={styles.card} role="alert">{error}</div> : !result ? <p role="status">Завантажуємо замовлення…</p> : <>
      <p className={styles.muted}>Знайдено: {result.totalElements}</p>
      {result.content.length === 0 ? <div className={styles.card}><h2>Замовлень не знайдено</h2><p>Тут з’являться ваші покупки. Якщо ви шукали замовлення, змініть номер або період.</p><Link href="/">До каталогу</Link></div> : result.content.map(order => {
        const image = resolveMediaUrl(order.items[0]?.imageUrl);
        return <Link className={`${styles.card} ${styles.order}`} href={`/account/orders/${order.id}`} key={order.id}>
          {image && <Image src={image} alt="" width={64} height={64} unoptimized className={styles.thumbnail} />}
          <div className={styles.grow}><strong>№ {order.orderNumber}</strong><p className={styles.muted}>{formatDate(order.createdAt)} · {order.items.length} позицій</p><span className={styles.badge}>{getOrderStatusLabel(order.status)}</span></div>
          <strong>{formatPrice(order.totalAmount)} ₴</strong><span aria-hidden="true">→</span>
        </Link>;
      })}
      {result.totalPages > 1 && <nav className={styles.toolbar} aria-label="Сторінки замовлень"><button disabled={page === 1} onClick={() => setPage(x => x - 1)}>← Назад</button><span>{page} / {result.totalPages}</span><button disabled={page >= result.totalPages} onClick={() => setPage(x => x + 1)}>Далі →</button></nav>}
    </>}
  </AccountPageShell>;
}

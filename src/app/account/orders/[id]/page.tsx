"use client";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "../../../../context/AuthContext";
import AccountPageShell from "../../../../components/account/AccountPageShell";
import { accountRequest, type CustomerOrder } from "../../../../lib/api/account";
import { getOrderStatusLabel } from "../../../../lib/api/orders";
import { deliveryCarrierLabel } from "../../../../lib/api/delivery";
import { resolveMediaUrl } from "../../../../lib/api/client";
import { formatDateTime, formatPrice } from "../../../../lib/format";
import styles from "../../../../components/account/AccountData.module.css";

export default function OrderDetailsPage() {
  const { id } = useParams<{ id: string }>(); const { user } = useAuth();
  const userId = user?.id;
  const [order, setOrder] = useState<CustomerOrder | null>(null); const [error, setError] = useState("");
  useEffect(() => {
    if (!userId) return;
    let active = true;
    const load = () => accountRequest<CustomerOrder>("orders/" + encodeURIComponent(id)).then(data => { if (active) { setOrder(data); setError(""); } }).catch(error => { if (active) setError(error.message); });
    void load(); const timer = setInterval(() => { if (document.visibilityState === "visible") void load(); }, 30000);
    return () => { active = false; clearInterval(timer); };
  }, [id, userId]);
  return <AccountPageShell><Link className={styles.link} href="/account/orders">← Усі замовлення</Link>
    {error ? <section className={styles.card} role="alert">{error}</section> : !order ? <p role="status">Завантажуємо замовлення…</p> : <>
      <section className={styles.card}><h1>Замовлення № {order.orderNumber}</h1><p className={styles.muted}>{formatDateTime(order.createdAt)}</p><span className={styles.badge}>{getOrderStatusLabel(order.status)}</span></section>
      {order.items.map(item => {
        const image = resolveMediaUrl(item.imageUrl);
        return <article className={`${styles.card} ${styles.order}`} key={item.id}>{image && <Image src={image} alt="" width={72} height={72} unoptimized className={styles.thumbnail} />}
          <div className={styles.grow}>{item.productSlug ? <Link href={`/product/${item.productSlug}`}>{item.name}</Link> : <strong>{item.name}</strong>}<p className={styles.muted}>{item.quantity} × {formatPrice(item.unitPrice)} ₴</p></div><strong>{formatPrice(item.totalPrice)} ₴</strong></article>;
      })}
      <section className={styles.card}><dl className={styles.totals}><dt>Товари</dt><dd>{formatPrice(order.subtotal)} ₴</dd><dt>Знижка</dt><dd>−{formatPrice(order.discountAmount)} ₴</dd><dt>Доставка</dt><dd>{formatPrice(order.deliveryPrice)} ₴</dd><dt><strong>Разом</strong></dt><dd><strong>{formatPrice(order.totalAmount)} ₴</strong></dd></dl></section>
      <div className={styles.grid}><section className={styles.card}><h2>Отримувач і доставка</h2><p>{order.recipientName}<br />{order.recipientPhone}<br />{order.recipientEmail}</p>{order.delivery ? <div><h3>{deliveryCarrierLabel(order.delivery.carrier)}</h3><p>{order.delivery.city}<br />{order.delivery.pickupPoint}</p>{order.delivery.reference ? <p className={styles.reference}><strong>Номер відправлення: {order.delivery.reference}</strong></p> : <p className={styles.muted}>{order.status === "CANCELLED" ? "Відправлення скасовано" : "Номер відправлення з’явиться після підтвердження оплати."}</p>}</div> : <p>{order.deliveryAddress ?? "Адресу не вказано"}</p>}<Link href={`/account/messages?order=${order.id}&title=${encodeURIComponent("Замовлення № " + order.orderNumber)}`}>Звернутися до підтримки</Link></section>
        <section className={styles.card}><h2>Історія замовлення</h2><ol className={styles.timeline}>{order.history.map((event, index) => <li key={`${event.createdAt}:${index}`}><strong>{getOrderStatusLabel(event.status)}</strong><p className={styles.muted}>{formatDateTime(event.createdAt)}</p></li>)}</ol></section></div>
    </>}
  </AccountPageShell>;
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../../context/AuthContext";
import AccountPageShell from "../../../../components/account/AccountPageShell";
import ReviewReply from "../../../../components/product/ReviewReply";
import PageTitle from "../../../../components/account/PageTitle";
import EmptyState from "../../../../components/account/EmptyState";
import ReviewForm from "../../../../components/account/ReviewForm";
import { getProductsAwaitingReview, getMyReviews } from "../../../../lib/api/reviews";
import { resolveMediaUrl } from "../../../../lib/api/client";
import type { ApiReview, ReviewableProduct } from "../../../../types/review";
import styles from "./page.module.css";
import Icon from "../../../../components/common/Icon";

type Filter = "waiting" | "mine";
const statusLabel = (status: string | number) => status === "PUBLISHED" || status === 1 ? "Опубліковано"
  : status === "REJECTED" || status === 2 ? "Відхилено модератором" : "На перевірці";

function ReviewsContent() {
  const [tab, setTab] = useState<"products" | "seller">("products");
  const { user } = useAuth();
  const userId = user?.id;
  const router = useRouter();
  const searchParams = useSearchParams();
  const filter: Filter = searchParams.get("tab") === "mine" ? "mine" : "waiting";
  const [waiting, setWaiting] = useState<ReviewableProduct[]>([]);
  const [mine, setMine] = useState<ApiReview[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let active = true;
    const load = async () => {
      setLoading(true); setError(""); setSelected(null);
      try {
        if (filter === "waiting") {
          const result = await getProductsAwaitingReview(page);
          if (active) { setWaiting(result.items); setTotalPages(result.totalPages); }
        } else {
          const result = await getMyReviews(page);
          if (active) { setMine(result.items); setTotalPages(result.totalPages); }
        }
      } catch (error) { if (active) setError(error instanceof Error ? error.message : "Не вдалося завантажити відгуки."); }
      finally { if (active) setLoading(false); }
    };
    void load();
    return () => { active = false; };
  }, [filter, page, userId, revision]);

  function choose(value: Filter) { router.replace(value === "mine" ? "/account/reviews?tab=mine" : "/account/reviews", { scroll: false }); setPage(1); setSelected(null); setSuccess(""); }
  function submitted() {
    setSuccess("Дякуємо! Відгук надіслано на перевірку. Його можна переглянути у вкладці «Мої відгуки».");
    setSelected(null); setPage(1); setRevision(value => value + 1);
  }

  return <AccountPageShell>
    <PageTitle>Відгуки</PageTitle>
    <div className={styles.banner}>
      <Icon src="/icons/star.svg" alt="" className={styles.bannerIcon} />
      <div><p className={styles.bannerTitle}>Поділіться враженнями про покупку</p>
        <p className={styles.bannerText}>Відгук можна залишити після оплати та отримання товару. Це допомагає іншим покупцям зробити вибір.</p></div>
    </div>
    <div className={styles.tabsRow}>
      <button type="button" className={`${styles.tab} ${tab === "products" ? styles.tabActive : ""}`} onClick={() => setTab("products")}>Про товари</button>
      <button type="button" className={`${styles.tab} ${tab === "seller" ? styles.tabActive : ""}`} onClick={() => setTab("seller")}>Про продавця</button>
    </div>
    {tab === "products" ? <><div className={styles.pillsRow}>
      <button type="button" className={`${styles.pill} ${filter === "waiting" ? styles.pillActive : ""}`} onClick={() => choose("waiting")}>Чекають відгуків</button>
      <button type="button" className={`${styles.pill} ${filter === "mine" ? styles.pillActive : ""}`} onClick={() => choose("mine")}>Мої відгуки</button>
    </div>
    {success && <p role="status">{success}</p>}
    {loading ? <p role="status">Завантажуємо відгуки…</p> : error ? <div role="alert"><p>{error}</p><button className={styles.pill} onClick={() => setRevision(value => value + 1)}>Спробувати ще раз</button></div>
      : filter === "waiting" ? waiting.length === 0 ? <EmptyState icon="/icons/star.svg" title="Немає товарів, що очікують відгук" subtitle="Тут з’являться оплачені та отримані товари, про які ви ще не залишили відгук." />
        : <div className={styles.list}>{waiting.map(item => {
          const image = resolveMediaUrl(item.imageUrl);
          return <article key={item.orderItemId} className={styles.reviewCard}>
            <div className={styles.row}>{image ? <Image src={image} alt="" width={48} height={48} unoptimized className={styles.thumb} /> : <Icon src="/icons/box.svg" className={styles.thumb} />}
              <div className={styles.itemTitle}>{item.productSlug ? <Link href={`/product/${item.productSlug}`}>{item.title}</Link> : item.title}<p><Link href={`/account/orders/${item.orderId}`}>{item.orderNumber}</Link></p></div>
              {selected !== item.orderItemId && <button type="button" className={styles.reviewButton} onClick={() => setSelected(item.orderItemId)}>Залишити відгук</button>}</div>
            {selected === item.orderItemId && <div className={styles.formWrap}><ReviewForm orderItemId={item.orderItemId} productId={item.productId} onSubmitted={submitted} onCancel={() => setSelected(null)} /></div>}
          </article>;
        })}</div>
      : mine.length === 0 ? <EmptyState icon="/icons/star.svg" title="Ви ще не залишали відгуків" subtitle="Тут з’являться ваші відгуки та результати перевірки модератором." />
        : <div className={styles.list}>{mine.map(review => <article key={review.id} className={styles.myReview}><div className={styles.reviewMeta}><strong aria-label={`Оцінка ${review.rating} з 5`}>{"★".repeat(review.rating)}</strong><span>{statusLabel(review.status)}</span></div>{review.title && <h2>{review.title}</h2>}<p className={styles.reviewText}>{review.comment}</p><ReviewReply text={review.staffReply} repliedAt={review.staffRepliedAt} /><Link href="/account/orders">До моїх замовлень</Link></article>)}</div>}
    {!loading && !error && totalPages > 1 && <nav className={styles.pillsRow} aria-label="Сторінки відгуків"><button className={styles.pill} disabled={page <= 1} onClick={() => setPage(value => value - 1)}>Назад</button><span>{page} / {totalPages}</span><button className={styles.pill} disabled={page >= totalPages} onClick={() => setPage(value => value + 1)}>Далі</button></nav>}
    </> : <EmptyState icon="/icons/star.svg" title="Немає відгуків про продавців" subtitle="Тут з’являться ваші відгуки про продавців після покупки" />}
  </AccountPageShell>;
}

export default function ReviewsPage() {
  return <Suspense fallback={<AccountPageShell><p role="status">Завантажуємо відгуки…</p></AccountPageShell>}><ReviewsContent /></Suspense>;
}

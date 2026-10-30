"use client";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStaff } from "@/components/admin/AdminShell";
import Icon from "@/components/admin/Icon";
import { Alert, Badge, Button, Card, Confirm, Empty, Feedback, Field, Hero, Loading, Pagination, useAction } from "@/components/admin/ui";
import { useResource } from "./api";
import { useAdminI18n } from "./i18n/provider";
import { message, type AdminLanguage } from "./i18n/core";
import { applyReviewDecision, renderReviewReply, reviewStatus, reviewStatuses, reviewsQuery } from "./review-replies";
import type { Paged, Review, ReviewReplyTemplate } from "./types";

const statusNames = { PENDING: message("На перевірці"), PUBLISHED: message("Опубліковані"), REJECTED: message("Відхилені"), ALL: message("Усі відгуки") };
export default function Reviews() {
  const { date, language, t } = useAdminI18n();
  const staff = useStaff(), params = useSearchParams(), router = useRouter();
  const status = reviewStatus(new URLSearchParams(params)), tab = reviewStatuses.indexOf(status as typeof reviewStatuses[number]);
  const resource = useResource<Paged<Review>>("reviews?" + reviewsQuery(new URLSearchParams(params)));
  const pending = useResource<number>("reviews/pending-count", 30000);
  const action = useAction();
  const [selected, setSelected] = useState<{ review: Review; status: "PUBLISHED" | "REJECTED" } | null>(null);
  const [reply, setReply] = useState("");
  const [replyLanguage, setReplyLanguage] = useState<AdminLanguage>(language);
  const [templateId, setTemplateId] = useState("");
  const templates = useResource<ReviewReplyTemplate[]>(selected?.status === "PUBLISHED" ? "reviews/reply-templates" : null);
  const tabs = useRef<(HTMLButtonElement | null)[]>([]);
  const data = resource.data;
  useEffect(() => {
    if (!data || data.content.length || data.page <= 1 || resource.loading) return;
    const query = new URLSearchParams(params);
    query.set("page", String(Math.min(data.page - 1, Math.max(1, data.totalPages))));
    router.replace("/admin/reviews?" + query, { scroll: false });
  }, [data, resource.loading, params, router]);
  function filter(next: string) {
    action.setSuccess("");
    const query = new URLSearchParams(params);
    query.set("status", next); query.delete("page");
    router.push("/admin/reviews?" + query, { scroll: false });
  }
  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); action.setSuccess("");
    const query = new URLSearchParams(params), text = String(new FormData(event.currentTarget).get("search") ?? "").trim();
    if (text) query.set("search", text); else query.delete("search");
    query.delete("page"); router.push("/admin/reviews?" + query, { scroll: false });
  }
  function open(review: Review, next: "PUBLISHED" | "REJECTED") {
    action.setError(""); action.setSuccess("");
    setReply(review.staffReply ?? ""); setTemplateId(""); setReplyLanguage(language); setSelected({ review, status: next });
  }
  async function save() {
    if (!selected || action.busy || (selected.status === "PUBLISHED" && reply.length > 2000)) return;
    const text = selected.status === "PUBLISHED" ? reply.trim() : undefined;
    const result = await action.run(`reviews/${selected.review.id}/moderate`, { status: selected.status, ...(text !== undefined ? { reply: text } : {}) }, "PUT");
    if (result === undefined) return;
    resource.setData(value => applyReviewDecision(value, selected.review.id, selected.status, text, status));
    if (selected.review.status === "PENDING") pending.setData(value => value === null ? null : Math.max(0, value - 1));
    setSelected(null);
    void resource.reload(); void pending.reload();
  }
  return <>
    <Hero title={t("Відгуки")} description={t("Перевіряйте відгуки покупців перед публікацією.")} action={<Button icon="refresh" tone="secondary" disabled={action.busy || resource.loading} onClick={() => { void resource.reload(); void pending.reload(); }}>{t("Оновити")}</Button>} />
    <Alert message={resource.error || pending.error} />{!selected && <Feedback action={action} />}
    <Card>
      <div className="treba-admin-review-tabs" role="tablist" aria-label={t("Статус відгуків")} style={{ "--review-tab": tab, "--review-col": tab % 2, "--review-row": Math.floor(tab / 2) } as CSSProperties}>
        {reviewStatuses.map((value, index) => <button ref={element => { tabs.current[index] = element; }} key={value} id={`review-tab-${value}`} role="tab" aria-controls="review-results" aria-selected={status === value} tabIndex={status === value ? 0 : -1} disabled={action.busy} onClick={() => filter(value)} onKeyDown={event => {
          const target = event.key === "ArrowRight" ? (index + 1) % 4 : event.key === "ArrowLeft" ? (index + 3) % 4 : event.key === "Home" ? 0 : event.key === "End" ? 3 : null;
          if (target === null) return; event.preventDefault(); tabs.current[target]?.focus(); filter(reviewStatuses[target]);
        }}><Icon name={value === "PENDING" ? "clock" : value === "PUBLISHED" ? "check" : value === "REJECTED" ? "close" : "layers"} size={17} /><span>{t(statusNames[value])}</span>{value === "PENDING" && pending.data !== null && <b>{pending.data}</b>}</button>)}
      </div>
      <form key={params.get("search") ?? ""} className="treba-admin-review-search" onSubmit={search}>
        <label className="treba-admin-search"><Icon name="search" /><input name="search" type="search" aria-label={t("Пошук відгуків")} placeholder={t("Товар, автор або текст відгуку…")} defaultValue={params.get("search") ?? ""} /></label>
        <Button icon="search" type="submit" tone="secondary" disabled={action.busy}>{t("Знайти")}</Button>
        {params.get("search") && <Button icon="close" tone="secondary" disabled={action.busy} onClick={() => { const query = new URLSearchParams(params); query.delete("search"); query.delete("page"); router.push("/admin/reviews?" + query, { scroll: false }); }}>{t("Скинути пошук")}</Button>}
      </form>
    </Card>
    <div id="review-results" role="tabpanel" aria-labelledby={`review-tab-${status}`} aria-busy={resource.loading} className="treba-admin-review-results">
      {resource.loading ? <Card><Loading /></Card> : !data?.content.length && !resource.error ? <Card><Empty title={t("Відгуків не знайдено")} description={t("Оберіть інший статус або змініть пошуковий запит.")} /></Card> : <>
        <p className="treba-admin-review-results-count">{t("Знайдено відгуків: {0}", [data?.totalElements ?? 0])}</p>
        <div className="treba-admin-customer-reviews">{data?.content.map((review, index) => <article key={review.id} className="treba-admin-customer-review" aria-label={review.productName} style={{ animationDelay: `${Math.min(index * 25, 150)}ms` }}>
          <header><div className="treba-admin-review-product"><span><Icon name="box" size={21} /></span><div><small>{t("Товар")}</small><Link href={staff.role === "Moderator" || !review.productId ? "/admin/products?search=" + encodeURIComponent(review.productName) : `/admin/products/${review.productId}/edit`}>{review.productName}</Link></div></div><Badge value={review.status} /></header>
          <div className="treba-admin-review-author"><span className="treba-admin-review-initials" aria-hidden="true">{review.authorName.split(/\s+/).filter(Boolean).slice(0, 2).map(value => value[0]).join("")}</span><div><strong>{review.authorName}</strong><small>{review.authorEmail}</small></div><time dateTime={review.createdAt}>{date(review.createdAt)}</time></div>
          <div className="treba-admin-review-rating"><span role="img" aria-label={t("Оцінка {0} з 5", [review.rating])}>{Array.from({ length: 5 }, (_, star) => <Icon name="star" key={star} size={19} style={{ color: star < review.rating ? "#d99a24" : "#cbd4e2", fill: star < review.rating ? "currentColor" : "transparent" }} />)}</span>{review.verifiedPurchase && <small><Icon name="shield" size={14} />{t("Покупку підтверджено")}</small>}</div>
          {review.title && <h2>{review.title}</h2>}<p className="treba-admin-review-comment">{review.comment}</p>
          {review.staffReply && <div className="treba-admin-staff-reply"><header><strong><Icon name="chat" size={17} />{t("Відповідь TREBA")}</strong><small>{date(review.staffRepliedAt ?? undefined)}</small></header><p>{review.staffReply}</p></div>}
          <footer><Button icon={review.status === "PUBLISHED" ? "chat" : "check"} disabled={action.busy} tone={review.status === "PUBLISHED" ? "secondary" : "primary"} onClick={() => open(review, "PUBLISHED")}>{review.status === "PUBLISHED" ? review.staffReply ? t("Редагувати відповідь") : t("Відповісти") : t("Схвалити відгук")}</Button>{review.status !== "REJECTED" && <Button icon="close" tone="danger" disabled={action.busy} onClick={() => open(review, "REJECTED")}>{t("Відхилити")}</Button>}</footer>
        </article>)}</div>{data && data.totalPages > 1 && <Pagination data={data} />}
      </>}
    </div>
    {selected && <Confirm title={selected.status === "REJECTED" ? t("Відхилити відгук?") : selected.review.status === "PUBLISHED" ? t("Відповідь на відгук") : t("Схвалити відгук та відповісти")} error={action.error} busy={action.busy} confirmDisabled={selected.status === "PUBLISHED" && reply.length > 2000} confirmLabel={selected.status === "REJECTED" ? t("Відхилити") : selected.review.status === "PUBLISHED" ? t("Зберегти відповідь") : reply.trim() ? t("Опублікувати з відповіддю") : t("Опублікувати без відповіді")} confirmIcon={selected.status === "REJECTED" ? "close" : "check"} onClose={() => setSelected(null)} onConfirm={() => void save()}>
      <div className="treba-admin-review-quote"><strong>{selected.review.productName}</strong><small>{selected.review.authorName} · {selected.review.rating} / 5</small><p>{selected.review.comment}</p></div>
      {selected.status === "PUBLISHED" ? <>
        <Alert message={templates.error} />
        <div className="treba-admin-reply-selects"><Field label={t("Мова шаблонів")}><select value={replyLanguage} disabled={action.busy} onChange={event => { setReplyLanguage(event.target.value as AdminLanguage); setTemplateId(""); }}><option value="uk">Українська</option><option value="en">English</option></select></Field><Field label={t("Готова відповідь")}><select value={templateId} disabled={action.busy || templates.loading} onChange={event => { const value = templates.data?.find(row => row.id === event.target.value); setTemplateId(event.target.value); if (value) setReply(renderReviewReply(value, replyLanguage, selected.review)); }}><option value="">{templates.loading ? t("Завантаження") : t("Власний текст / без шаблону")}</option>{templates.data?.map(template => <option key={template.id} value={template.id}>{template.name}</option>)}</select></Field></div>
        {!templates.loading && !templates.error && !templates.data?.length && <p className="treba-admin-note">{t("Готових відповідей поки немає. Можна написати власну.")}</p>}
        {templates.error && <Button tone="secondary" icon="refresh" onClick={() => void templates.reload()}>{t("Спробувати ще раз")}</Button>}
        <Field label={t("Відповідь покупцю (необов’язково)")}><textarea rows={5} maxLength={2000} disabled={action.busy} value={reply} placeholder={t("Оберіть шаблон або напишіть свою відповідь…")} onChange={event => { setReply(event.target.value); setTemplateId(""); }} /></Field><small className={reply.length > 2000 ? "treba-admin-reply-limit" : "treba-admin-note"}>{reply.length} / 2000</small>
        <p className="treba-admin-note">{reply.length > 2000 ? t("Скоротіть відповідь до 2000 символів.") : selected.review.staffReply && !reply.trim() ? t("Порожній текст прибере відповідь TREBA. Відгук залишиться опублікованим.") : t("Відповідь буде видима покупцям під відгуком. Перед публікацією перевірте текст.")}</p>
        {staff.role === "Administrator" && <Link className="treba-admin-text-link" href="/admin/settings/features">{t("Керувати шаблонами в налаштуваннях → Функції")}</Link>}
      </> : <p className="treba-admin-note">{t("Відгук буде приховано зі сторінки товару.")}</p>}
    </Confirm>}
  </>;
}

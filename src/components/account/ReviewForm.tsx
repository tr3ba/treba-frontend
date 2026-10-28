"use client";

import { useState, type FormEvent } from "react";
import { createReview } from "../../lib/api/reviews";
import styles from "./ReviewForm.module.css";

export default function ReviewForm({ orderItemId, productId, onSubmitted, onCancel }: {
  orderItemId: string; productId: string; onSubmitted: () => void; onCancel: () => void;
}) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try { await createReview({ orderItemId, productId, rating, title: title.trim(), comment: comment.trim() }); onSubmitted(); }
    catch (error) { setError(error instanceof Error ? error.message : "Не вдалося надіслати відгук."); setBusy(false); }
  }
  return <form className={styles.form} onSubmit={submit} aria-label="Відгук про придбаний товар">
    <label>Оцінка<select value={rating} onChange={event => setRating(Number(event.target.value))} disabled={busy}>
      {[5, 4, 3, 2, 1].map(value => <option value={value} key={value}>{value} з 5 {"★".repeat(value)}</option>)}
    </select></label>
    <label>Заголовок (необов’язково)<input maxLength={255} value={title} onChange={event => setTitle(event.target.value)} disabled={busy} /></label>
    <label>Ваш відгук<textarea required maxLength={10000} rows={4} value={comment} onChange={event => setComment(event.target.value)} disabled={busy} /></label>
    <p>Відгук з’явиться на сторінці товару після перевірки модератором.</p>
    {error && <p role="alert">{error}</p>}
    <div className={styles.actions}><button type="submit" disabled={busy || !comment.trim()}>{busy ? "Надсилаємо…" : "Надіслати відгук"}</button>
      <button type="button" onClick={onCancel} disabled={busy}>Скасувати</button></div>
  </form>;
}

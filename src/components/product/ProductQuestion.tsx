import Link from "next/link";
export default function ProductQuestion({ id, slug, title }: { id?: string; slug: string; title: string }) {
  if (!id) return null;
  return <section style={{ padding: 20, border: "1px solid #e5e5e5", borderRadius: 12, marginTop: 20 }}>
    <h2 style={{ fontSize: 18, margin: "0 0 8px" }}>Є питання про товар?</h2>
    <p style={{ fontSize: 14, lineHeight: 1.6, color: "#666" }}>Уточніть характеристики або умови покупки в особистій переписці з підтримкою TREBA.</p>
    <Link href={`/account/messages?product=${encodeURIComponent(id)}&slug=${encodeURIComponent(slug)}&title=${encodeURIComponent(title)}`} style={{ display: "inline-block", padding: "12px 18px", borderRadius: 8, background: "#002aff", color: "white", fontWeight: 600 }}>Задати питання</Link>
  </section>;
}

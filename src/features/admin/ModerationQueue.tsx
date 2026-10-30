"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStaff } from "@/components/admin/AdminShell";
import Icon from "@/components/admin/Icon";
import { ActionLink, Alert, Badge, Button, Card, Confirm, Empty, Feedback, Field, Filters, Hero, Loading, Pagination, Table, useAction } from "@/components/admin/ui";
import { resolveMediaUrl } from "@/lib/api/client";
import { useResource } from "./api";
import { message } from "./i18n/core";
import { useAdminI18n } from "./i18n/provider";
import { groupReviewAttributes, moderationQuery, removeReviewedProduct, reviewAttributeValue, reviewIndex, reviewNeighbor } from "./moderation-review";
import type { AttributeDefinition, Change, Lookup, ModerationEvent, Paged, Product, ProductImage } from "./types";

export default function ModerationQueue() {
  const { t } = useAdminI18n();
  const staff = useStaff();
  const params = useSearchParams(), router = useRouter();
  const all = params.get("view") === "all";
  const resource = useResource<Paged<Product>>("catalog/products?" + moderationQuery(new URLSearchParams(params)));
  const pending = useResource<number>("catalog/moderation/pending-count", 60000);
  const options = useResource<{ categories: Lookup[]; brands: Lookup[]; sellers: Lookup[] }>("catalog/filter-options");
  const action = useAction();
  const [decision, setDecision] = useState<{ product: Product; type: "approve" | "reject" } | null>(null);
  const [reason, setReason] = useState("");
  const items = resource.data?.content ?? [];
  const index = reviewIndex(items, params.get("item"));
  const current = items[index];
  const data = resource.data;
  const previous = data ? reviewNeighbor(data, index, -1) : null;
  const next = data ? reviewNeighbor(data, index, 1) : null;

  // Removing the last item on a page can also remove the page itself.
  useEffect(() => {
    if (!data || data.page <= 1 || data.content.length) return;
    const query = new URLSearchParams(params);
    query.set("page", String(Math.min(data.page - 1, Math.max(1, data.totalPages))));
    query.delete("item");
    router.replace("/admin/moderation?" + query, { scroll: false });
  }, [data, params, router]);

  function go(target: { page: number; item: string | null } | null) {
    if (!target || action.busy) return;
    const query = new URLSearchParams(params);
    query.set("page", String(target.page));
    if (target.item) query.set("item", target.item);
    else query.delete("item");
    router.push("/admin/moderation?" + query, { scroll: false });
  }
  function openDecision(product: Product, type: "approve" | "reject") {
    action.setError("");
    action.setSuccess("");
    setReason("");
    setDecision({ product, type });
  }
  async function decide() {
    if (!decision || action.busy) return;
    if (decision.type === "reject" && !reason.trim()) {
      action.setError(t("Укажіть причину відхилення."));
      return;
    }
    const result = await action.run(`products/${decision.product.id}/${decision.type}`, decision.type === "reject" ? { reason: reason.trim() } : undefined);
    if (result === undefined) return;
    resource.setData(value => removeReviewedProduct(value, decision.product.id));
    setDecision(null);
    setReason("");
    if (!all) {
      const query = new URLSearchParams(params);
      const neighbor = items[index + 1] ?? items[index - 1];
      if (neighbor) query.set("item", neighbor.id);
      else query.delete("item");
      router.replace("/admin/moderation?" + query, { scroll: false });
    }
    void resource.reload();
    void pending.reload();
  }
  return <>
    <Hero title={t("Модерація товарів")} description={t("Перевіряйте картки та порівнюйте зміни після повторної подачі.")} action={<ActionLink href="/admin/products" icon="arrowLeft">{t("До каталогу")}</ActionLink>} />
    {!decision && <Feedback action={action} />}
    <Alert message={resource.error || options.error || pending.error} />
    <Card>
      <div className="treba-admin-review-toolbar">
        <div className="treba-admin-review-count"><Icon name="shield" size={25} /><span>{t("Очікують модерації")}<strong>{pending.data ?? data?.totalElements ?? "—"}</strong></span></div>
        <div className="treba-admin-review-modes" role="group" aria-label={t("Режим перегляду")}>
          {([false, true] as const).map(value => <button key={String(value)} type="button" aria-pressed={all === value} disabled={action.busy} onClick={() => {
            const query = new URLSearchParams(params);
            query.set("view", value ? "all" : "single");
            router.replace("/admin/moderation?" + query, { scroll: false });
          }}><Icon name={value ? "grid" : "file"} size={18} />{value ? t("Усі товари") : t("По одному")}</button>)}
        </div>
        <Button tone="secondary" icon="refresh" disabled={resource.loading || action.busy} onClick={() => { void resource.reload(); void pending.reload(); }}>{t("Оновити")}</Button>
      </div>
      <Filters>
        {([
          ["categoryId", t("Категорія"), t("Усі категорії"), options.data?.categories],
          ["brandId", t("Бренд"), t("Усі бренди"), options.data?.brands],
          ["sellerId", t("Продавець"), t("Усі продавці"), options.data?.sellers],
        ] as const).map(([name, label, placeholder, values]) => <select key={name} name={name} aria-label={label} defaultValue={params.get(name) ?? ""}><option value="">{placeholder}</option>{values?.map(value => <option key={value.id} value={value.id}>{value.name}</option>)}</select>)}
        <select name="waitingHours" aria-label={t("Час очікування")} defaultValue={params.get("waitingHours") ?? ""}>
          <option value="">{t("Будь-який час очікування")}</option><option value="24">{t("Понад 24 години")}</option><option value="72">{t("Понад 72 години")}</option>
        </select>
        <select name="sort" aria-label={t("Сортування")} defaultValue={params.get("sort") ?? "waiting"}>
          <option value="waiting">{t("Спочатку найдавніші")}</option><option value="updated">{t("За оновленням")}</option><option value="nameasc">{t("За назвою")}</option><option value="priceasc">{t("За ціною")}</option>
        </select>
      </Filters>
      {data && !!items.length && <div className="treba-admin-review-navigation">
        <span aria-live="polite">{all ? t("На сторінці: {0} товарів", [items.length]) : t("Товар {0} із {1}", [(data.page - 1) * data.size + index + 1, data.totalElements])}</span>
        {!all && <div className="treba-admin-actions">
          <Button tone="secondary" icon="arrowLeft" disabled={!previous || action.busy} onClick={() => go(previous)}>{t("Попередній товар")}</Button>
          <Button tone="secondary" icon="arrowRight" disabled={!next || action.busy} onClick={() => go(next)}>{t("Наступний товар")}</Button>
        </div>}
      </div>}
    </Card>
    {resource.loading ? <Loading /> : !items.length && !resource.error ? <Card><Empty title={pending.data === 0 ? t("Усі товари перевірено") : t("Немає товарів за цими фільтрами")} description={pending.data === 0 ? t("Нові товари з’являться тут після подачі на модерацію.") : t("Змініть фільтри, щоб побачити інші товари в черзі.")} /></Card> : (all ? items : current ? [current] : []).map(product => <ProductReview key={product.id} product={product} canEdit={staff.role !== "Moderator"} busy={action.busy} onDecision={type => openDecision(product, type)} />)}
    {data && data.totalPages > 1 && <Pagination data={data} />}
    {decision && <Confirm title={decision.type === "approve" ? t("Схвалити товар?") : t("Відхилити товар?")} busy={action.busy} error={action.error} confirmDisabled={decision.type === "reject" && !reason.trim()} confirmLabel={decision.type === "approve" ? t("Схвалити") : t("Відхилити")} onClose={() => setDecision(null)} onConfirm={() => void decide()}>
      <strong>{decision.product.name}</strong><p className="treba-admin-note">{t("Рішення буде записано до історії модерації.")}</p>
      {decision.type === "reject" && <>
        <Field label={t("Шаблон причини")}><select defaultValue="" onChange={event => setReason(event.target.value)}><option value="">{t("Оберіть…")}</option>{[t("Додайте якісні фото товару."), t("Уточніть опис і характеристики товару."), t("Оберіть правильну категорію."), t("Перевірте ціну та залишок.")].map(value => <option key={value} value={value}>{value}</option>)}</select></Field>
        <Field label={t("Причина відхилення")}><textarea required maxLength={2000} rows={4} value={reason} onChange={event => setReason(event.target.value)} /></Field><small className="treba-admin-note">{reason.length} / 2000</small>
      </>}
    </Confirm>}
  </>;
}

function ProductReview({ product, canEdit, busy, onDecision }: { product: Product; canEdit: boolean; busy: boolean; onDecision: (type: "approve" | "reject") => void }) {
  const { date, money, language, t } = useAdminI18n();
  const variants = product.variants ?? [], values = product.attributes ?? [];
  const definitions = useResource<AttributeDefinition[]>(values.length ? "catalog/attributes?categoryId=" + product.categoryId : null);
  const attributes = groupReviewAttributes(values);
  return <article className="treba-admin-review-card" aria-label={product.name}>
    <div className="treba-admin-review-main">
      <ProductGallery product={product} />
      <div className="treba-admin-review-content">
        <div className="treba-admin-review-heading"><Badge value={product.status} /><small><Icon name="clock" size={15} /> {t("Подано на перевірку: {0}", [date(product.updatedAt)])}</small></div>
        <p className="treba-admin-review-category">{product.categoryName} · {product.brandName}</p><h2>{product.name}</h2>
        <dl className="treba-admin-review-meta">
          {[[t("Артикул"), product.sku], [t("Адреса товару (slug)"), product.slug], [t("Магазин"), product.storeName], [t("Продавець"), product.sellerName], [t("Артикул виробника"), product.manufacturerPartNumber], [t("Країна виробництва"), product.countryOfOrigin]].map(([name, value]) => <div key={name}><dt>{name}</dt><dd>{value || "—"}</dd></div>)}
        </dl>
        {product.shortDescription && <p className="treba-admin-review-summary">{product.shortDescription}</p>}
        <div className="treba-admin-review-facts"><div><span>{t("Ціна")}</span><strong>{money(product.price)}</strong></div><div><span>{t("Залишок")}</span><strong>{product.stockQuantity}{t(" шт.")}</strong></div><div><span>{t("Гарантія, місяців")}</span><strong>{product.warrantyMonths}</strong></div></div>
        <div className="treba-admin-actions">
          <Button icon="check" disabled={busy} onClick={() => onDecision("approve")}>{t("Схвалити")}</Button><Button tone="danger" icon="close" disabled={busy} onClick={() => onDecision("reject")}>{t("Відхилити")}</Button>
          {canEdit && <Link className="treba-admin-text-link" href={`/admin/products/${product.id}/edit`}><Icon name="edit" size={16} /> {t("Редагувати")}</Link>}
        </div>
      </div>
    </div>
    <section className="treba-admin-review-section"><h3><Icon name="file" />{t("Опис")}</h3><p className="treba-admin-review-description">{product.description || t("Опис не додано.")}</p></section>
    <section className="treba-admin-review-section"><h3><Icon name="layers" />{t("Характеристики")}</h3><Alert message={definitions.error} />{definitions.loading && values.length ? <Loading /> : attributes.length ? <dl className="treba-admin-review-attributes">{attributes.map(group => {
      const definition = definitions.data?.find(value => value.id === group.attributeId);
      const variant = variants.find(value => value.id === group.variantId);
      const formatted = group.values.map(value => reviewAttributeValue(value, definition)).filter(value => value !== null).map(value => typeof value === "boolean" ? value ? t("Так") : t("Ні") : typeof value === "number" ? new Intl.NumberFormat(language).format(value) : value).join(", ");
      return <div key={`${group.attributeId}/${group.variantId ?? ""}`}><dt>{definition?.name ?? group.attributeId}{group.variantId && <small>{variant?.name || variant?.sku || group.variantId}</small>}</dt><dd>{formatted || "—"}{definition?.unit ? " " + definition.unit : ""}</dd></div>;
    })}</dl> : <p className="treba-admin-note">{t("Характеристики не додано.")}</p>}</section>
    <section className="treba-admin-review-section"><h3><Icon name="box" />{t("Ціни та варіанти")}</h3>{variants.length ? <Table rows={variants} columns={[
      { title: t("Назва"), render: variant => variant.name || "—" }, { title: t("Артикул"), render: variant => variant.sku }, { title: t("Штрихкод"), render: variant => variant.barcode || "—" }, { title: t("Ціна"), render: variant => money(variant.price) }, { title: t("Стара ціна"), render: variant => variant.oldPrice == null ? "—" : money(variant.oldPrice) }, { title: t("Залишок"), render: variant => variant.stockQuantity }, { title: t("Активний"), render: variant => variant.isActive ? t("Так") : t("Ні") },
    ]} /> : <p className="treba-admin-note">{t("Варіанти не додано.")}</p>}</section>
    <ReviewHistory productId={product.id} />
  </article>;
}

function ProductGallery({ product }: { product: Product }) {
  const { t } = useAdminI18n();
  const images = [...(product.images ?? [])].sort((a, b) => Number(b.isMain) - Number(a.isMain) || a.sortOrder - b.sortOrder);
  const [index, setIndex] = useState(0), [failed, setFailed] = useState<string[]>([]);
  const image = images[index] ?? images[0];
  const url = resolveMediaUrl(image?.imageUrl);
  function picture(value: ProductImage, size: number) {
    const source = resolveMediaUrl(value.imageUrl);
    return source && !failed.includes(source) ? <Image unoptimized src={source} width={size} height={size} alt={value.altText || product.name} onError={() => setFailed(current => [...current, source])} /> : <span className="treba-admin-review-placeholder"><Icon name="image" size={size > 100 ? 65 : 22} />{size > 100 && <span>{t("Фото недоступне")}</span>}</span>;
  }
  return <div className="treba-admin-review-gallery">
    <div className="treba-admin-review-image">{image ? picture(image, 700) : <div className="treba-admin-review-placeholder"><Icon name="image" size={65} /><span>{t("Фото відсутнє")}</span></div>}</div>
    {images.length > 1 && <div className="treba-admin-review-gallery-nav"><Button tone="secondary" icon="arrowLeft" onClick={() => setIndex((index + images.length - 1) % images.length)}>{t("Попереднє фото")}</Button><span>{index + 1} / {images.length}</span><Button tone="secondary" icon="arrowRight" onClick={() => setIndex((index + 1) % images.length)}>{t("Наступне фото")}</Button></div>}
    {!!images.length && <div className="treba-admin-review-thumbnails">{images.map((value, position) => <button key={value.id} type="button" aria-pressed={position === index} aria-label={t("Фото {0} з {1}", [position + 1, images.length])} onClick={() => setIndex(position)}>{picture(value, 64)}</button>)}</div>}
    {url && !failed.includes(url) && <a href={url} target="_blank" rel="noopener noreferrer" className="treba-admin-text-link"><Icon name="link" size={16} /> {t("Відкрити фото в повному розмірі")}</a>}
  </div>;
}

const fieldNames: Record<string, string> = { Name: message("Назва"), Slug: message("Адреса товару (slug)"), Description: message("Опис"), ShortDescription: message("Короткий опис"), Category: message("Категорія"), Brand: message("Бренд"), Warranty: message("Гарантія, місяців"), CountryOfOrigin: message("Країна виробництва"), Images: message("Фотографії"), Variant: message("Варіант"), Attribute: message("Характеристика"), Price: message("Ціна"), OldPrice: message("Стара ціна"), Stock: message("Залишок"), Active: message("Активний"), Barcode: message("Штрихкод") };
function ReviewHistory({ productId }: { productId: string }) {
  const { date, label, t } = useAdminI18n();
  const [open, setOpen] = useState(false);
  const history = useResource<ModerationEvent[]>(open ? `catalog/products/${productId}/moderation-history` : null);
  const comparison = useResource<{ capturedAt?: string; changes: Change[] }>(open ? `catalog/products/${productId}/resubmission-changes` : null);
  return <details className="treba-admin-review-section treba-admin-review-history" onToggle={event => setOpen(event.currentTarget.open)}><summary><Icon name="clock" />{t("Історія перевірок та зміни після відхилення")}</summary>{open && <>
    <Alert message={history.error || comparison.error} />
    {history.loading || comparison.loading ? <Loading /> : <>
      <h3>{t("Зміни після повторної подачі")}</h3>
      {!comparison.error && (!comparison.data?.capturedAt ? <p className="treba-admin-note">{t("Попередній знімок для порівняння відсутній.")}</p> : !comparison.data.changes.length ? <p className="treba-admin-note">{t("Змін після попередньої перевірки немає.")}</p> : <><small className="treba-admin-note">{t("Попередня перевірка: {0}", [date(comparison.data.capturedAt)])}</small>{comparison.data.changes.map((change, index) => <div className="treba-admin-review-change" key={index}><b>{change.field.split(" / ").map(part => t(fieldNames[part] ?? part)).join(" / ")}</b><div className="treba-admin-comparison"><div><small>{t("Було")}</small><pre>{change.before || "—"}</pre></div><div><small>{t("Стало")}</small><pre>{change.after || "—"}</pre></div></div></div>)}</>)}
      <h3>{t("Історія модерації")}</h3><div className="treba-admin-timeline">{history.data?.map(event => <div key={event.id}><b>{event.actorName} · {label(event.decision)}</b><small>{date(event.occurredAt)}</small>{event.reason && <p>{event.reason}</p>}</div>)}</div>{!history.error && !history.data?.length && <p className="treba-admin-note">{t("Рішень щодо цього товару ще немає.")}</p>}
    </>}
  </>}</details>;
}

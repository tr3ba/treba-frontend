"use client";
import { useAdminI18n } from "@/features/admin/i18n/provider";
import { message } from "@/features/admin/i18n/core";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useStaff } from "@/components/admin/AdminShell";
import Icon from "@/components/admin/Icon";
import {
  ActionLink,
  Alert,
  Badge,
  Button,
  Card,
  Confirm,
  Feedback,
  Field,
  Filters,
  Hero,
  Loading,
  Pagination,
  Table,
  useAction,
} from "@/components/admin/ui";
import { adminRequest, useResource } from "./api";
import type {
  AttributeDefinition,
  Change,
  Lookup,
  ModerationEvent,
  Paged,
  Product,
  ProductImage,
  Variant,
} from "./types";
import { loadDraft, saveDraft, type EditorDraft } from "./drafts";
import Characteristics from "./Characteristics";
import { resolveMediaUrl } from "@/lib/api/client";
function Thumbnail({ images }: { images: ProductImage[] }) {
  const [failed, setFailed] = useState(false);
  const image = images.find((i) => i.isMain) ?? images[0];
  return image && !failed ? (
    <Image
      unoptimized
      width={42}
      height={44}
      className="treba-admin-thumb"
      src={resolveMediaUrl(image.imageUrl) ?? "/icons/box.svg"}
      alt=""
      onError={() => setFailed(true)}
    />
  ) : (
    <span className="treba-admin-thumb">
      <Icon name="image" />
    </span>
  );
}
export function Products({ moderation = false }: { moderation?: boolean }) {
  const { money, t } = useAdminI18n();
  const params = useSearchParams(),
    staff = useStaff();
  const query = new URLSearchParams(params);
  if (moderation) query.set("status", "PENDING_MODERATION");
  const resource = useResource<Paged<Product>>("catalog/products?" + query);
  const options = useResource<{
    categories: Lookup[];
    brands: Lookup[];
    sellers: Lookup[];
  }>("catalog/filter-options");
  const action = useAction(resource.reload),
    [selected, setSelected] = useState<string[]>([]),
    [decision, setDecision] = useState<{
      id: string;
      type: string;
    } | null>(null),
    [reason, setReason] = useState("");
  const [bulkPrice, setBulkPrice] = useState(""),
    [bulkStock, setBulkStock] = useState(""),
    [bulkPercent, setBulkPercent] = useState(""),
    [bulkActive, setBulkActive] = useState(""),
    [preview, setPreview] = useState<{
      token: string;
      rows: {
        productId: string;
        name: string;
        sku: string;
        beforePrice: number;
        afterPrice: number;
        beforeStock: number;
        afterStock: number;
      }[];
    } | null>(null);
  async function decide() {
    if (!decision) return;
    if (decision.type === "reject" && !reason.trim()) {
      action.setError(t("Укажіть причину відхилення."));
      return;
    }
    const result = await action.run(
      decision.type === "delete"
        ? `catalog/products/${decision.id}`
        : `products/${decision.id}/${decision.type}`,
      decision.type === "reject" ? { reason } : undefined,
      decision.type === "delete" ? "DELETE" : "POST",
    );
    if (result === undefined) return;
    setDecision(null);
    setReason("");
  }
  return (
    <>
      <Hero
        title={moderation ? t("Модерація товарів") : t("Товари")}
        description={
          moderation
            ? t(
                "Перевіряйте картки та порівнюйте зміни після повторної подачі.",
              )
            : t("Керуйте каталогом, цінами та доступними залишками.")
        }
        action={
          staff.role !== "Moderator" && (
            <ActionLink href="/admin/products/new">
              {t("Додати товар")}
            </ActionLink>
          )
        }
      />
      <Feedback action={action} />
      <Alert message={resource.error || options.error} />
      <Card>
        <Filters
          statuses={
            moderation
              ? undefined
              : ["ACTIVE", "PENDING_MODERATION", "DRAFT", "REJECTED"]
          }
        >
          <select
            name="categoryId"
            aria-label={t("Категорія")}
            defaultValue={params.get("categoryId") ?? ""}
          >
            <option value="">{t("Усі категорії")}</option>
            {options.data?.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            name="brandId"
            aria-label={t("Бренд")}
            defaultValue={params.get("brandId") ?? ""}
          >
            <option value="">{t("Усі бренди")}</option>
            {options.data?.brands.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {staff.role !== "Seller" && (
            <select
              name="sellerId"
              aria-label={t("Продавець")}
              defaultValue={params.get("sellerId") ?? ""}
            >
              <option value="">{t("Усі продавці")}</option>
              {options.data?.sellers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          <select
            name={moderation ? "waitingHours" : "stock"}
            aria-label={t("Додатковий фільтр")}
            defaultValue={
              params.get(moderation ? "waitingHours" : "stock") ?? ""
            }
          >
            {moderation ? (
              <>
                <option value="">{t("Будь-який час очікування")}</option>
                <option value="24">{t("Понад 24 години")}</option>
                <option value="72">{t("Понад 72 години")}</option>
              </>
            ) : (
              <>
                <option value="">{t("Усі залишки")}</option>
                <option value="available">{t("У наявності")}</option>
                <option value="out">{t("Немає в наявності")}</option>
              </>
            )}
          </select>
          {!moderation && (
            <>
              <input
                type="number"
                min="0"
                step="0.01"
                name="minPrice"
                aria-label={t("Ціна від")}
                placeholder={t("Ціна від")}
                defaultValue={params.get("minPrice") ?? ""}
              />
              <input
                type="number"
                min="0"
                step="0.01"
                name="maxPrice"
                aria-label={t("Ціна до")}
                placeholder={t("Ціна до")}
                defaultValue={params.get("maxPrice") ?? ""}
              />
            </>
          )}
          <select
            name="sort"
            aria-label={t("Сортування")}
            defaultValue={params.get("sort") ?? ""}
          >
            <option value="">{t("За замовчуванням")}</option>
            <option value="nameasc">{t("За назвою")}</option>
            <option value="priceasc">{t("За ціною")}</option>
            <option value="updated">{t("За оновленням")}</option>
          </select>
        </Filters>
        {!moderation && selected.length > 0 && staff.role !== "Moderator" && (
          <div className="treba-admin-bulk">
            <b>
              {t("Вибрано: ")}
              {selected.length}
            </b>
            <div className="treba-admin-filters">
              <input
                type="number"
                min="0.01"
                step="0.01"
                aria-label={t("Нова ціна")}
                placeholder={t("Нова ціна")}
                value={bulkPrice}
                onChange={(e) => {
                  setBulkPrice(e.target.value);
                  if (e.target.value) setBulkPercent("");
                }}
              />
              <input
                type="number"
                min="0"
                aria-label={t("Новий залишок")}
                placeholder={t("Новий залишок")}
                value={bulkStock}
                onChange={(e) => setBulkStock(e.target.value)}
              />
              <input
                type="number"
                aria-label={t("Зміна ціни у відсотках")}
                placeholder={t("Зміна ціни, %")}
                min="-99.99"
                max="1000"
                step="0.01"
                value={bulkPercent}
                onChange={(e) => {
                  setBulkPercent(e.target.value);
                  if (e.target.value) setBulkPrice("");
                }}
              />
              <select
                aria-label={t("Активність варіантів")}
                value={bulkActive}
                onChange={(e) => setBulkActive(e.target.value)}
              >
                <option value="">{t("Не змінювати активність")}</option>
                <option value="true">{t("Активувати варіанти")}</option>
                <option value="false">{t("Вимкнути варіанти")}</option>
              </select>
              <Button
                disabled={
                  action.busy ||
                  (!bulkPrice && !bulkStock && !bulkPercent && !bulkActive)
                }
                tone="secondary"
                onClick={() =>
                  void action
                    .run<typeof preview>("catalog/bulk/preview", {
                      productIds: selected,
                      price: bulkPrice ? Number(bulkPrice) : null,
                      stockQuantity: bulkStock ? Number(bulkStock) : null,
                      pricePercent: bulkPercent ? Number(bulkPercent) : null,
                      isActive:
                        bulkActive === "" ? null : bulkActive === "true",
                    })
                    .then((result) => {
                      if (result) setPreview(result);
                    })
                }
              >
                {t("Переглянути зміни")}
              </Button>
            </div>
          </div>
        )}
        {resource.loading ? (
          <Loading />
        ) : (
          resource.data && (
            <>
              <Table
                rows={resource.data.content}
                columns={[
                  {
                    title: t("Вибір"),
                    render: (p) => (
                      <input
                        type="checkbox"
                        aria-label={t("Вибрати {0}", [p.name])}
                        checked={selected.includes(p.id)}
                        onChange={(e) =>
                          setSelected(
                            e.target.checked
                              ? [...selected, p.id]
                              : selected.filter((id) => id !== p.id),
                          )
                        }
                      />
                    ),
                  },
                  {
                    title: t("Товар"),
                    render: (p) => (
                      <div className="treba-admin-product-cell">
                        <Thumbnail images={p.images} />
                        <div>
                          <strong>{p.name}</strong>
                          <small>
                            {p.sku} · {p.brandName}
                          </small>
                        </div>
                      </div>
                    ),
                  },
                  {
                    title: t("Категорія"),
                    render: (p) => (
                      <>
                        {p.categoryName}
                        <small>{p.storeName}</small>
                      </>
                    ),
                  },
                  {
                    title: t("Статус"),
                    render: (p) => <Badge value={p.status} />,
                  },
                  {
                    title: t("Ціна / залишок"),
                    render: (p) => (
                      <>
                        <strong>{money(p.price)}</strong>
                        <small>
                          {p.stockQuantity}
                          {t(" шт.")}
                        </small>
                      </>
                    ),
                  },
                  {
                    title: t("Дії"),
                    render: (p) => (
                      <div className="treba-admin-actions">
                        {staff.role !== "Moderator" && (
                          <Link
                            className="treba-admin-text-link"
                            href={`/admin/products/${p.id}/edit`}
                          >
                            {t("Редагувати")}
                          </Link>
                        )}
                        {!moderation && staff.role !== "Moderator" && (
                          <Button
                            tone="icon"
                            icon="trash"
                            disabled={action.busy}
                            onClick={() =>
                              setDecision({ id: p.id, type: "delete" })
                            }
                          >
                            {t("Прибрати")}
                          </Button>
                        )}
                        {moderation ? (
                          <>
                            <Button
                              tone="secondary"
                              disabled={action.busy}
                              icon="check"
                              onClick={() =>
                                setDecision({ id: p.id, type: "approve" })
                              }
                            >
                              {t("Схвалити")}
                            </Button>
                            <Button
                              icon="close"
                              tone="danger"
                              disabled={action.busy}
                              onClick={() =>
                                setDecision({ id: p.id, type: "reject" })
                              }
                            >
                              {t("Відхилити")}
                            </Button>
                          </>
                        ) : p.status === "DRAFT" || p.status === "REJECTED" ? (
                          <Button
                            tone="secondary"
                            disabled={action.busy}
                            onClick={() =>
                              void action.run(`products/${p.id}/submit`)
                            }
                          >
                            {t("На перевірку")}
                          </Button>
                        ) : null}
                      </div>
                    ),
                  },
                ]}
              />
              <Pagination data={resource.data} />
            </>
          )
        )}
      </Card>
      {moderation &&
        resource.data?.content.map((p) => (
          <ModerationDetails key={p.id} product={p} />
        ))}
      {decision && (
        <Confirm
          error={action.error}
          title={
            decision.type === "approve"
              ? t("Схвалити товар?")
              : decision.type === "delete"
                ? t("Прибрати товар з каталогу?")
                : t("Відхилити товар?")
          }
          onClose={() => setDecision(null)}
          onConfirm={() => void decide()}
          busy={action.busy}
        >
          <p>
            {decision.type === "delete"
              ? t(
                  "Товар буде прибрано з активного каталогу. Історія замовлень збережеться.",
                )
              : t("Рішення буде записано до історії модерації.")}
          </p>
          {decision.type === "reject" && (
            <Field label={t("Причина відхилення")}>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={2000}
                required
              />
            </Field>
          )}
        </Confirm>
      )}
      {preview && (
        <Confirm
          error={action.error}
          title={t("Підтвердити масові зміни")}
          onClose={() => setPreview(null)}
          busy={action.busy}
          onConfirm={() =>
            void action
              .run("catalog/bulk/apply", { token: preview.token })
              .then(() => {
                setPreview(null);
                setSelected([]);
              })
          }
        >
          <Table
            rows={preview.rows}
            columns={[
              { title: t("Товар"), render: (r) => r.name },
              {
                title: t("Ціна"),
                render: (r) => `${r.beforePrice} → ${r.afterPrice}`,
              },
              {
                title: t("Залишок"),
                render: (r) => `${r.beforeStock} → ${r.afterStock}`,
              },
            ]}
          />
        </Confirm>
      )}
    </>
  );
}
function ModerationDetails({ product }: { product: Product }) {
  const { date, t } = useAdminI18n();
  const [open, setOpen] = useState(false);
  const comparison = useResource<{
    capturedAt?: string;
    changes: Change[];
  }>(open ? `catalog/products/${product.id}/resubmission-changes` : null);
  const history = useResource<ModerationEvent[]>(
    open ? `catalog/products/${product.id}/moderation-history` : null,
  );
  return (
    <Card>
      <Button tone="secondary" icon="layers" onClick={() => setOpen(!open)}>
        {product.name}
        {t(" · Деталі перевірки")}
      </Button>
      {open && (
        <>
          <p className="treba-admin-note">{product.description}</p>
          <div className="treba-admin-photo-grid">
            {product.images.map((i) => (
              <div className="treba-admin-photo" key={i.id}>
                <Image
                  unoptimized
                  width={320}
                  height={240}
                  src={resolveMediaUrl(i.imageUrl) ?? "/icons/box.svg"}
                  alt={product.name}
                />
              </div>
            ))}
          </div>
          <Alert message={comparison.error || history.error} />
          {!comparison.data?.capturedAt ? (
            <p className="treba-admin-note">
              {t("Попередній знімок для порівняння відсутній.")}
            </p>
          ) : (
            comparison.data.changes.map((c, i) => (
              <div key={i}>
                <b>{c.field}</b>
                <div className="treba-admin-comparison">
                  <pre>{c.before || "—"}</pre>
                  <pre>{c.after || "—"}</pre>
                </div>
              </div>
            ))
          )}
          <div className="treba-admin-timeline">
            {history.data?.map((e) => (
              <div key={e.id}>
                <b>
                  {e.actorName} · {e.decision}
                </b>
                <small>{date(e.occurredAt)}</small>
                <p>{e.reason}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
function normalizeProduct(product: Product): Product {
  return {
    ...product,
    variants: product.variants ?? [],
    attributes: product.attributes ?? [],
    images: product.images ?? [],
  };
}
const freshProduct = (): Product => ({
  id: "",
  name: "",
  slug: "",
  storeId: "",
  storeName: "",
  sellerName: "",
  categoryId: "",
  categoryName: "",
  brandId: "",
  brandName: "",
  status: "DRAFT",
  shortDescription: "",
  description: "",
  sku: "",
  price: 1,
  stockQuantity: 0,
  warrantyMonths: 0,
  countryOfOrigin: "",
  manufacturerPartNumber: "",
  updatedAt: "",
  createdAt: "",
  images: [],
  variants: [],
  attributes: [],
});
const freshVariant = (name: string): Variant => ({
  id: crypto.randomUUID(),
  name,
  sku: "",
  price: 1,
  oldPrice: null,
  stockQuantity: 0,
  barcode: null,
  isActive: true,
});
export function ProductEditor({ id }: { id?: string }) {
  const { t } = useAdminI18n();
  const staff = useStaff(),
    router = useRouter(),
    source = useResource<Product>(id ? `catalog/products/${id}` : null);
  const [model, setModel] = useState<Product | null>(id ? null : freshProduct),
    [files, setFiles] = useState<File[]>([]),
    [recovery, setRecovery] = useState<EditorDraft | null>(null),
    [saving, setSaving] = useState(false),
    [savedDraft, setSavedDraft] = useState(false),
    [draftError, setDraftError] = useState(""),
    [addingAttribute, setAddingAttribute] = useState(false),
    [attributeName, setAttributeName] = useState(""),
    [attributeUnit, setAttributeUnit] = useState(""),
    [duplicates, setDuplicates] = useState<
      | {
          name: string;
          storeName: string;
          reason: string;
        }[]
      | null
    >(null);
  const action = useAction(),
    dirty = useRef(false),
    initialized = useRef(false);
  const key = `treba-admin-draft:${staff.id}:${id ?? "new"}`;
  const categories = useResource<Lookup[]>("catalog/categories"),
    brands = useResource<Lookup[]>("catalog/brands"),
    stores = useResource<Lookup[]>("catalog/stores");
  const definitions = useResource<AttributeDefinition[]>(
    model?.categoryId
      ? "catalog/attributes?categoryId=" + model.categoryId
      : null,
  );
  useEffect(() => {
    if (source.data && !initialized.current) {
      setModel(normalizeProduct(source.data));
      initialized.current = true;
    }
  }, [source.data]);
  useEffect(() => {
    let active = true;
    void loadDraft(key)
      .then((value) => {
        if (active) setRecovery(value);
      })
      .catch(() => {
        if (active) setDraftError(message("Не вдалося прочитати чернетку."));
      });
    return () => {
      active = false;
    };
  }, [key]);
  useEffect(() => {
    if (!model || (!dirty.current && !files.length) || recovery) return;
    const timeout = setTimeout(() => {
      void saveDraft(key, { model, files })
        .then(() => setSavedDraft(true))
        .catch(() =>
          setDraftError(
            message(
              "Автозбереження недоступне. Збережіть товар перед виходом.",
            ),
          ),
        );
    }, 1000);
    return () => clearTimeout(timeout);
  }, [model, files, key, recovery]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty.current || files.length) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [files.length]);
  function change<K extends keyof Product>(field: K, value: Product[K]) {
    dirty.current = true;
    setSavedDraft(false);
    action.setSuccess("");
    setModel((m) => (m ? { ...m, [field]: value } : m));
  }
  function variant(index: number, patch: Partial<Variant>) {
    if (model)
      change(
        "variants",
        model.variants.map((v, i) => (i === index ? { ...v, ...patch } : v)),
      );
  }
  async function save() {
    if (!model || saving) return;
    setSaving(true);
    action.setError("");
    try {
      const effectiveId = id || model.id;
      const saved = await adminRequest<Product>(
        effectiveId ? `catalog/products/${effectiveId}` : "catalog/products",
        {
          method: effectiveId ? "PUT" : "POST",
          body: {
            ...model,
            expectedUpdatedAt: effectiveId ? model.updatedAt : null,
            variants: model.variants.length ? model.variants : null,
          },
        },
      );
      // Keep the returned version before uploading; a failed upload must never create a second product.
      setModel(normalizeProduct(saved));
      dirty.current = false;
      await saveDraft(key, { model: saved, files });
      for (let i = 0; i < files.length; i++) {
        const form = new FormData();
        form.append("file", files[i]);
        form.append("isMain", String(!saved.images.length && i === 0));
        form.append("sortOrder", String(saved.images.length + i));
        await adminRequest(`products/${saved.id}/images/upload`, {
          method: "POST",
          body: form,
        });
        setFiles((current) => current.filter((f) => f !== files[i]));
        await saveDraft(key, {
          model: await adminRequest<Product>(`catalog/products/${saved.id}`),
          files: files.slice(i + 1),
        });
      }
      await saveDraft(key, null);
      setModel(
        normalizeProduct(
          await adminRequest<Product>(`catalog/products/${saved.id}`),
        ),
      );
      action.setSuccess(t("Товар збережено"));
      router.replace(`/admin/products/${saved.id}/edit`);
    } catch (e) {
      action.setError(e instanceof Error ? e.message : t("Помилка збереження"));
    } finally {
      setSaving(false);
    }
  }
  if (!model)
    return (
      <>
        <Hero title={t("Редактор товару")} />
        <Alert message={source.error} />
        <Loading />
      </>
    );
  return (
    <>
      <Hero
        title={id ? t("Редагування товару") : t("Новий товар")}
        description={t("Заповніть картку, додайте варіанти та фотографії.")}
        action={
          <Link className="treba-admin-button secondary" href="/admin/products">
            {t("До каталогу")}
          </Link>
        }
      />
      <Alert message={source.error || draftError} />
      <Feedback action={action} />
      {recovery && (
        <Card icon="file" title={t("Знайдено незбережену чернетку")}>
          <div className="treba-admin-actions">
            <Button
              icon="refresh"
              onClick={() => {
                setModel(normalizeProduct(recovery.model));
                setFiles(recovery.files);
                dirty.current = true;
                setRecovery(null);
              }}
            >
              {t("Відновити")}
            </Button>
            <Button
              icon="trash"
              tone="secondary"
              onClick={() => {
                void saveDraft(key, null);
                setRecovery(null);
              }}
            >
              {t("Видалити чернетку")}
            </Button>
          </div>
        </Card>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void save();
        }}
      >
        <div className="treba-admin-two-grid">
          <div>
            <Card icon="file" title={t("Основна інформація")}>
              <div className="treba-admin-form-grid">
                <Field label={t("Назва *")} wide>
                  <input
                    value={model.name}
                    maxLength={250}
                    required
                    onChange={(e) => change("name", e.target.value)}
                  />
                </Field>
                <Field label={t("Адреса товару (slug) *")}>
                  <input
                    value={model.slug}
                    pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                    required
                    onChange={(e) => change("slug", e.target.value)}
                  />
                </Field>
                <Field label={t("Артикул виробника")}>
                  <input
                    value={model.manufacturerPartNumber}
                    onChange={(e) =>
                      change("manufacturerPartNumber", e.target.value)
                    }
                    maxLength={100}
                  />
                </Field>
                <Field label={t("Короткий опис")} wide>
                  <textarea
                    value={model.shortDescription}
                    maxLength={500}
                    onChange={(e) => change("shortDescription", e.target.value)}
                  />
                </Field>
                <Field label={t("Опис")} wide>
                  <textarea
                    rows={8}
                    value={model.description}
                    maxLength={10000}
                    onChange={(e) => change("description", e.target.value)}
                  />
                </Field>
              </div>
            </Card>
            <Card icon="gift" title={t("Ціни та варіанти")}>
              {!model.variants.length ? (
                <div className="treba-admin-three-grid">
                  <Field label="SKU *">
                    <input
                      required
                      value={model.sku}
                      onChange={(e) => change("sku", e.target.value)}
                    />
                  </Field>
                  <Field label={t("Ціна, ₴ *")}>
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={model.price}
                      onChange={(e) => change("price", Number(e.target.value))}
                    />
                  </Field>
                  <Field label={t("Залишок")}>
                    <input
                      type="number"
                      min="0"
                      max="1000000"
                      value={model.stockQuantity}
                      onChange={(e) =>
                        change("stockQuantity", Number(e.target.value))
                      }
                    />
                  </Field>
                </div>
              ) : (
                model.variants.map((v, index) => (
                  <div className="treba-admin-editor-row" key={v.id}>
                    <Field label={t("Назва")}>
                      <input
                        value={v.name}
                        required
                        onChange={(e) =>
                          variant(index, { name: e.target.value })
                        }
                      />
                    </Field>
                    <Field label="SKU">
                      <input
                        value={v.sku}
                        required
                        onChange={(e) =>
                          variant(index, { sku: e.target.value })
                        }
                      />
                    </Field>
                    <Field label={t("Штрихкод")}>
                      <input
                        value={v.barcode ?? ""}
                        onChange={(e) =>
                          variant(index, { barcode: e.target.value || null })
                        }
                      />
                    </Field>
                    <Field label={t("Ціна")}>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        value={v.price}
                        onChange={(e) =>
                          variant(index, { price: Number(e.target.value) })
                        }
                      />
                    </Field>
                    <Field label={t("Стара ціна")}>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={v.oldPrice ?? ""}
                        onChange={(e) =>
                          variant(index, {
                            oldPrice: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                      />
                    </Field>
                    <Field label={t("Залишок")}>
                      <input
                        type="number"
                        min="0"
                        value={v.stockQuantity}
                        onChange={(e) =>
                          variant(index, {
                            stockQuantity: Number(e.target.value),
                          })
                        }
                      />
                    </Field>
                    <label className="treba-admin-check">
                      <input
                        type="checkbox"
                        checked={v.isActive}
                        onChange={(e) =>
                          variant(index, { isActive: e.target.checked })
                        }
                      />
                      {t("Активний")}
                    </label>
                    <Button
                      tone="icon"
                      icon="trash"
                      onClick={() =>
                        change(
                          "variants",
                          model.variants.filter((_, i) => i !== index),
                        )
                      }
                    >
                      {t("Видалити")}
                    </Button>
                  </div>
                ))
              )}
              <div className="treba-admin-actions">
                <Button
                  tone="secondary"
                  icon="plus"
                  onClick={() =>
                    change("variants", [
                      ...model.variants,
                      model.variants.length
                        ? freshVariant(t("Основний"))
                        : {
                            ...freshVariant(t("Основний")),
                            sku: model.sku,
                            price: model.price,
                            stockQuantity: model.stockQuantity,
                          },
                    ])
                  }
                >
                  {t("Додати варіант")}
                </Button>
              </div>
            </Card>
            <Card icon="layers" title={t("Характеристики")}>
              <Alert message={definitions.error} />
              <div className="treba-admin-actions">
                <Button
                  tone="secondary"
                  icon="plus"
                  disabled={!model.categoryId || action.busy}
                  onClick={() => setAddingAttribute(true)}
                >
                  {t("Додати характеристику категорії")}
                </Button>
                <Button
                  icon="shield"
                  tone="secondary"
                  disabled={!model.brandId || action.busy}
                  onClick={() =>
                    void action
                      .run<
                        {
                          name: string;
                          storeName: string;
                          reason: string;
                        }[]
                      >("catalog/duplicates", {
                        brandId: model.brandId,
                        manufacturerPartNumber: model.manufacturerPartNumber,
                        barcodes: model.variants
                          .map((v) => v.barcode)
                          .filter(Boolean),
                        excludeId: model.id || null,
                      })
                      .then((result) => {
                        if (result) setDuplicates(result);
                      })
                  }
                >
                  {t("Перевірити дублікати")}
                </Button>
              </div>
              {duplicates?.map((d, i) => (
                <p className="treba-admin-note" key={i}>
                  {d.name} · {d.storeName} · {d.reason}
                </p>
              ))}
              {duplicates?.length === 0 && (
                <p className="treba-admin-note">
                  {t("Схожих товарів не знайдено.")}
                </p>
              )}
              <Characteristics
                definitions={definitions.data ?? []}
                values={model.attributes}
                variants={model.variants}
                onChange={(values) => change("attributes", values)}
              />
              {!definitions.data?.length && (
                <p className="treba-admin-note">
                  {t("Оберіть категорію, щоб побачити її характеристики.")}
                </p>
              )}
            </Card>
          </div>
          <div>
            <Card icon="box" title={t("Публікація")}>
              <div className="treba-admin-form-grid">
                {[
                  ["categoryId", t("Категорія"), categories.data],
                  ["brandId", t("Бренд"), brands.data],
                  ["storeId", t("Магазин"), stores.data],
                ].map(([field, title, values]) => (
                  <Field key={String(field)} label={String(title) + " *"} wide>
                    <select
                      required
                      value={
                        model[field as "categoryId" | "brandId" | "storeId"]
                      }
                      onChange={(e) =>
                        change(field as "categoryId", e.target.value)
                      }
                    >
                      <option value="">{t("Оберіть…")}</option>
                      {(values as Lookup[] | null)?.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                ))}
                <Field label={t("Гарантія, місяців")}>
                  <input
                    type="number"
                    min="0"
                    max="120"
                    value={model.warrantyMonths}
                    onChange={(e) =>
                      change("warrantyMonths", Number(e.target.value))
                    }
                  />
                </Field>
                <Field label={t("Країна виробництва")}>
                  <input
                    value={model.countryOfOrigin}
                    onChange={(e) => change("countryOfOrigin", e.target.value)}
                  />
                </Field>
              </div>
              <p className="treba-admin-note">
                {savedDraft
                  ? t("Текст чернетки збережено на цьому пристрої.")
                  : t("Незбережені зміни зберігаються на цьому пристрої.")}{" "}
                {t(
                  "Фотографії також зберігаються в чернетці та завантажуються під час збереження.",
                )}
              </p>
              <div className="treba-admin-actions">
                <Button
                  type="submit"
                  icon="check"
                  disabled={saving || action.busy}
                >
                  {t("Зберегти товар")}
                </Button>
                {id && (
                  <Button
                    tone="secondary"
                    onClick={() => void action.run(`products/${id}/submit`)}
                  >
                    {t("На модерацію")}
                  </Button>
                )}
              </div>
            </Card>
            <Card icon="image" title={t("Фотографії")}>
              <p className="treba-admin-note">
                {t("До 8 зображень, JPEG / PNG / WebP / GIF, до 5 МБ кожне.")}
              </p>
              <div className="treba-admin-photo-grid">
                {model.images.map((image) => (
                  <div className="treba-admin-photo" key={image.id}>
                    <Image
                      unoptimized
                      width={320}
                      height={240}
                      src={resolveMediaUrl(image.imageUrl) ?? "/icons/box.svg"}
                      alt={t("Фото товару")}
                    />
                    <small>
                      {image.isMain ? t("Головне фото") : t("Фото товару")}
                    </small>
                    <Button
                      tone="icon"
                      icon="trash"
                      onClick={() =>
                        void action
                          .run(
                            `products/${model.id}/images/${image.id}`,
                            undefined,
                            "DELETE",
                          )
                          .then(async (result) => {
                            if (result !== undefined)
                              setModel(
                                await adminRequest<Product>(
                                  `catalog/products/${model.id}`,
                                ),
                              );
                          })
                      }
                    >
                      {t("Видалити")}
                    </Button>
                  </div>
                ))}
                {files.map((file, i) => (
                  <div className="treba-admin-photo" key={i}>
                    <small>{file.name}</small>
                    <Button
                      icon="trash"
                      tone="icon"
                      onClick={() =>
                        setFiles(files.filter((_, index) => index !== i))
                      }
                    >
                      {t("Прибрати")}
                    </Button>
                  </div>
                ))}
              </div>
              <label className="treba-admin-upload">
                <Icon name="upload" />
                <input
                  type="file"
                  aria-label={t("Додати фото")}
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => {
                    const next = [
                      ...files,
                      ...Array.from(e.target.files ?? []),
                    ];
                    if (
                      next.length + model.images.length > 8 ||
                      next.some((f) => f.size > 5 * 1024 * 1024)
                    ) {
                      action.setError(
                        t("Дозволено до 8 фото розміром до 5 МБ."),
                      );
                      return;
                    }
                    setFiles(next);
                  }}
                />
              </label>
            </Card>
            {id && <ModerationDetails product={model} />}
          </div>
        </div>
      </form>
      {addingAttribute && (
        <Confirm
          error={action.error}
          title={t("Нова характеристика")}
          busy={action.busy}
          onClose={() => setAddingAttribute(false)}
          onConfirm={() => {
            if (!attributeName.trim()) return;
            void action
              .run("catalog/attributes", {
                categoryId: model.categoryId,
                name: attributeName,
                unit: attributeUnit || null,
              })
              .then(async (result) => {
                if (result !== undefined) {
                  await definitions.reload();
                  setAddingAttribute(false);
                  setAttributeName("");
                }
              });
          }}
        >
          <Field label={t("Назва")}>
            <input
              value={attributeName}
              onChange={(e) => setAttributeName(e.target.value)}
              maxLength={200}
            />
          </Field>
          <Field label={t("Одиниця виміру")}>
            <input
              value={attributeUnit}
              onChange={(e) => setAttributeUnit(e.target.value)}
              maxLength={30}
            />
          </Field>
          <Alert message={action.error} />
        </Confirm>
      )}
    </>
  );
}

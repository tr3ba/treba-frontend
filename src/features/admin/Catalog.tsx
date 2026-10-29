"use client";
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
import { adminRequest, date, money, useResource } from "./api";
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
      className="ad-thumb"
      src={resolveMediaUrl(image.imageUrl) ?? "/icons/box.svg"}
      alt=""
      onError={() => setFailed(true)}
    />
  ) : (
    <span className="ad-thumb">
      <Icon name="image" />
    </span>
  );
}
export function Products({ moderation = false }: { moderation?: boolean }) {
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
    [decision, setDecision] = useState<{ id: string; type: string } | null>(
      null,
    ),
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
      action.setError("Укажіть причину відхилення.");
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
        title={moderation ? "Модерація товарів" : "Товари"}
        description={
          moderation
            ? "Перевіряйте картки та порівнюйте зміни після повторної подачі."
            : "Керуйте каталогом, цінами та доступними залишками."
        }
        action={
          staff.role !== "Moderator" && (
            <ActionLink href="/admin/products/new">Додати товар</ActionLink>
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
            aria-label="Категорія"
            defaultValue={params.get("categoryId") ?? ""}
          >
            <option value="">Усі категорії</option>
            {options.data?.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            name="brandId"
            aria-label="Бренд"
            defaultValue={params.get("brandId") ?? ""}
          >
            <option value="">Усі бренди</option>
            {options.data?.brands.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {staff.role !== "Seller" && (
            <select
              name="sellerId"
              aria-label="Продавець"
              defaultValue={params.get("sellerId") ?? ""}
            >
              <option value="">Усі продавці</option>
              {options.data?.sellers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          <select
            name={moderation ? "waitingHours" : "stock"}
            aria-label="Додатковий фільтр"
            defaultValue={
              params.get(moderation ? "waitingHours" : "stock") ?? ""
            }
          >
            {moderation ? (
              <>
                <option value="">Будь-який час очікування</option>
                <option value="24">Понад 24 години</option>
                <option value="72">Понад 72 години</option>
              </>
            ) : (
              <>
                <option value="">Усі залишки</option>
                <option value="available">У наявності</option>
                <option value="out">Немає в наявності</option>
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
                aria-label="Ціна від"
                placeholder="Ціна від"
                defaultValue={params.get("minPrice") ?? ""}
              />
              <input
                type="number"
                min="0"
                step="0.01"
                name="maxPrice"
                aria-label="Ціна до"
                placeholder="Ціна до"
                defaultValue={params.get("maxPrice") ?? ""}
              />
            </>
          )}
          <select
            name="sort"
            aria-label="Сортування"
            defaultValue={params.get("sort") ?? ""}
          >
            <option value="">За замовчуванням</option>
            <option value="nameasc">За назвою</option>
            <option value="priceasc">За ціною</option>
            <option value="updated">За оновленням</option>
          </select>
        </Filters>
        {!moderation && selected.length > 0 && staff.role !== "Moderator" && (
          <div className="ad-bulk">
            <b>Вибрано: {selected.length}</b>
            <div className="ad-filters">
              <input
                type="number"
                min="0.01"
                step="0.01"
                aria-label="Нова ціна"
                placeholder="Нова ціна"
                value={bulkPrice}
                onChange={(e) => {
                  setBulkPrice(e.target.value);
                  if (e.target.value) setBulkPercent("");
                }}
              />
              <input
                type="number"
                min="0"
                aria-label="Новий залишок"
                placeholder="Новий залишок"
                value={bulkStock}
                onChange={(e) => setBulkStock(e.target.value)}
              />
              <input
                type="number"
                aria-label="Зміна ціни у відсотках"
                placeholder="Зміна ціни, %"
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
                aria-label="Активність варіантів"
                value={bulkActive}
                onChange={(e) => setBulkActive(e.target.value)}
              >
                <option value="">Не змінювати активність</option>
                <option value="true">Активувати варіанти</option>
                <option value="false">Вимкнути варіанти</option>
              </select>
              <Button
                disabled={
                  action.busy ||
                  (!bulkPrice && !bulkStock && !bulkPercent && !bulkActive)
                }
                tone="secondary"
                onClick={() =>
                  void action
                    .run<
                      typeof preview
                    >("catalog/bulk/preview", { productIds: selected, price: bulkPrice ? Number(bulkPrice) : null, stockQuantity: bulkStock ? Number(bulkStock) : null, pricePercent: bulkPercent ? Number(bulkPercent) : null, isActive: bulkActive === "" ? null : bulkActive === "true" })
                    .then((result) => {
                      if (result) setPreview(result);
                    })
                }
              >
                Переглянути зміни
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
                    title: "Вибір",
                    render: (p) => (
                      <input
                        type="checkbox"
                        aria-label={`Вибрати ${p.name}`}
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
                    title: "Товар",
                    render: (p) => (
                      <div className="ad-product-cell">
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
                    title: "Категорія",
                    render: (p) => (
                      <>
                        {p.categoryName}
                        <small>{p.storeName}</small>
                      </>
                    ),
                  },
                  {
                    title: "Статус",
                    render: (p) => <Badge value={p.status} />,
                  },
                  {
                    title: "Ціна / залишок",
                    render: (p) => (
                      <>
                        <strong>{money(p.price)}</strong>
                        <small>{p.stockQuantity} шт.</small>
                      </>
                    ),
                  },
                  {
                    title: "Дії",
                    render: (p) => (
                      <div className="ad-actions">
                        {staff.role !== "Moderator" && (
                          <Link
                            className="ad-text-link"
                            href={`/admin/products/${p.id}/edit`}
                          >
                            Редагувати
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
                            Прибрати
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
                              Схвалити
                            </Button>
                            <Button
                              tone="danger"
                              disabled={action.busy}
                              onClick={() =>
                                setDecision({ id: p.id, type: "reject" })
                              }
                            >
                              Відхилити
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
                            На перевірку
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
              ? "Схвалити товар?"
              : decision.type === "delete"
                ? "Прибрати товар з каталогу?"
                : "Відхилити товар?"
          }
          onClose={() => setDecision(null)}
          onConfirm={() => void decide()}
          busy={action.busy}
        >
          <p>
            {decision.type === "delete"
              ? "Товар буде прибрано з активного каталогу. Історія замовлень збережеться."
              : "Рішення буде записано до історії модерації."}
          </p>
          {decision.type === "reject" && (
            <Field label="Причина відхилення">
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
          title="Підтвердити масові зміни"
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
              { title: "Товар", render: (r) => r.name },
              {
                title: "Ціна",
                render: (r) => `${r.beforePrice} → ${r.afterPrice}`,
              },
              {
                title: "Залишок",
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
  const [open, setOpen] = useState(false);
  const comparison = useResource<{ capturedAt?: string; changes: Change[] }>(
    open ? `catalog/products/${product.id}/resubmission-changes` : null,
  );
  const history = useResource<ModerationEvent[]>(
    open ? `catalog/products/${product.id}/moderation-history` : null,
  );
  return (
    <Card>
      <Button tone="secondary" icon="layers" onClick={() => setOpen(!open)}>
        {product.name} · Деталі перевірки
      </Button>
      {open && (
        <>
          <p className="ad-note">{product.description}</p>
          <div className="ad-photo-grid">
            {product.images.map((i) => (
              <div className="ad-photo" key={i.id}>
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
            <p className="ad-note">
              Попередній знімок для порівняння відсутній.
            </p>
          ) : (
            comparison.data.changes.map((c, i) => (
              <div key={i}>
                <b>{c.field}</b>
                <div className="ad-comparison">
                  <pre>{c.before || "—"}</pre>
                  <pre>{c.after || "—"}</pre>
                </div>
              </div>
            ))
          )}
          <div className="ad-timeline">
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
const freshVariant = (): Variant => ({
  id: crypto.randomUUID(),
  name: "Основний",
  sku: "",
  price: 1,
  oldPrice: null,
  stockQuantity: 0,
  barcode: null,
  isActive: true,
});
export function ProductEditor({ id }: { id?: string }) {
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
      { name: string; storeName: string; reason: string }[] | null
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
        if (active) setDraftError("Не вдалося прочитати чернетку.");
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
            "Автозбереження недоступне. Збережіть товар перед виходом.",
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
      action.setSuccess("Товар збережено");
      router.replace(`/admin/products/${saved.id}/edit`);
    } catch (e) {
      action.setError(e instanceof Error ? e.message : "Помилка збереження");
    } finally {
      setSaving(false);
    }
  }
  if (!model)
    return (
      <>
        <Hero title="Редактор товару" />
        <Alert message={source.error} />
        <Loading />
      </>
    );
  return (
    <>
      <Hero
        title={id ? "Редагування товару" : "Новий товар"}
        description="Заповніть картку, додайте варіанти та фотографії."
        action={
          <Link className="ad-button secondary" href="/admin/products">
            До каталогу
          </Link>
        }
      />
      <Alert message={source.error || draftError} />
      <Feedback action={action} />
      {recovery && (
        <Card title="Знайдено незбережену чернетку">
          <div className="ad-actions">
            <Button
              onClick={() => {
                setModel(normalizeProduct(recovery.model));
                setFiles(recovery.files);
                dirty.current = true;
                setRecovery(null);
              }}
            >
              Відновити
            </Button>
            <Button
              tone="secondary"
              onClick={() => {
                void saveDraft(key, null);
                setRecovery(null);
              }}
            >
              Видалити чернетку
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
        <div className="ad-two-grid">
          <div>
            <Card title="Основна інформація">
              <div className="ad-form-grid">
                <Field label="Назва *" wide>
                  <input
                    value={model.name}
                    maxLength={250}
                    required
                    onChange={(e) => change("name", e.target.value)}
                  />
                </Field>
                <Field label="Адреса товару (slug) *">
                  <input
                    value={model.slug}
                    pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                    required
                    onChange={(e) => change("slug", e.target.value)}
                  />
                </Field>
                <Field label="Артикул виробника">
                  <input
                    value={model.manufacturerPartNumber}
                    onChange={(e) =>
                      change("manufacturerPartNumber", e.target.value)
                    }
                    maxLength={100}
                  />
                </Field>
                <Field label="Короткий опис" wide>
                  <textarea
                    value={model.shortDescription}
                    maxLength={500}
                    onChange={(e) => change("shortDescription", e.target.value)}
                  />
                </Field>
                <Field label="Опис" wide>
                  <textarea
                    rows={8}
                    value={model.description}
                    maxLength={10000}
                    onChange={(e) => change("description", e.target.value)}
                  />
                </Field>
              </div>
            </Card>
            <Card title="Ціни та варіанти">
              {!model.variants.length ? (
                <div className="ad-three-grid">
                  <Field label="SKU *">
                    <input
                      required
                      value={model.sku}
                      onChange={(e) => change("sku", e.target.value)}
                    />
                  </Field>
                  <Field label="Ціна, ₴ *">
                    <input
                      type="number"
                      min="0.01"
                      step="0.01"
                      required
                      value={model.price}
                      onChange={(e) => change("price", Number(e.target.value))}
                    />
                  </Field>
                  <Field label="Залишок">
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
                  <div className="ad-editor-row" key={v.id}>
                    <Field label="Назва">
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
                    <Field label="Штрихкод">
                      <input
                        value={v.barcode ?? ""}
                        onChange={(e) =>
                          variant(index, { barcode: e.target.value || null })
                        }
                      />
                    </Field>
                    <Field label="Ціна">
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
                    <Field label="Стара ціна">
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
                    <Field label="Залишок">
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
                    <label className="ad-check">
                      <input
                        type="checkbox"
                        checked={v.isActive}
                        onChange={(e) =>
                          variant(index, { isActive: e.target.checked })
                        }
                      />
                      Активний
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
                      Видалити
                    </Button>
                  </div>
                ))
              )}
              <div className="ad-actions">
                <Button
                  tone="secondary"
                  icon="plus"
                  onClick={() =>
                    change("variants", [
                      ...model.variants,
                      model.variants.length
                        ? freshVariant()
                        : {
                            ...freshVariant(),
                            sku: model.sku,
                            price: model.price,
                            stockQuantity: model.stockQuantity,
                          },
                    ])
                  }
                >
                  Додати варіант
                </Button>
              </div>
            </Card>
            <Card title="Характеристики">
              <Alert message={definitions.error} />
              <div className="ad-actions">
                <Button
                  tone="secondary"
                  icon="plus"
                  disabled={!model.categoryId || action.busy}
                  onClick={() => setAddingAttribute(true)}
                >
                  Додати характеристику категорії
                </Button>
                <Button
                  tone="secondary"
                  disabled={!model.brandId || action.busy}
                  onClick={() =>
                    void action
                      .run<
                        { name: string; storeName: string; reason: string }[]
                      >("catalog/duplicates", { brandId: model.brandId, manufacturerPartNumber: model.manufacturerPartNumber, barcodes: model.variants.map((v) => v.barcode).filter(Boolean), excludeId: model.id || null })
                      .then((result) => {
                        if (result) setDuplicates(result);
                      })
                  }
                >
                  Перевірити дублікати
                </Button>
              </div>
              {duplicates?.map((d, i) => (
                <p className="ad-note" key={i}>
                  {d.name} · {d.storeName} · {d.reason}
                </p>
              ))}
              {duplicates?.length === 0 && (
                <p className="ad-note">Схожих товарів не знайдено.</p>
              )}
              <Characteristics
                definitions={definitions.data ?? []}
                values={model.attributes}
                variants={model.variants}
                onChange={(values) => change("attributes", values)}
              />
              {!definitions.data?.length && (
                <p className="ad-note">
                  Оберіть категорію, щоб побачити її характеристики.
                </p>
              )}
            </Card>
          </div>
          <div>
            <Card title="Публікація">
              <div className="ad-form-grid">
                {[
                  ["categoryId", "Категорія", categories.data],
                  ["brandId", "Бренд", brands.data],
                  ["storeId", "Магазин", stores.data],
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
                      <option value="">Оберіть…</option>
                      {(values as Lookup[] | null)?.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                ))}
                <Field label="Гарантія, місяців">
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
                <Field label="Країна виробництва">
                  <input
                    value={model.countryOfOrigin}
                    onChange={(e) => change("countryOfOrigin", e.target.value)}
                  />
                </Field>
              </div>
              <p className="ad-note">
                {savedDraft
                  ? "Текст чернетки збережено на цьому пристрої."
                  : "Незбережені зміни зберігаються на цьому пристрої."}{" "}
                Фотографії також зберігаються в чернетці та завантажуються під
                час збереження.
              </p>
              <div className="ad-actions">
                <Button
                  type="submit"
                  icon="check"
                  disabled={saving || action.busy}
                >
                  Зберегти товар
                </Button>
                {id && (
                  <Button
                    tone="secondary"
                    onClick={() => void action.run(`products/${id}/submit`)}
                  >
                    На модерацію
                  </Button>
                )}
              </div>
            </Card>
            <Card title="Фотографії">
              <p className="ad-note">
                До 8 зображень, JPEG / PNG / WebP / GIF, до 5 МБ кожне.
              </p>
              <div className="ad-photo-grid">
                {model.images.map((image) => (
                  <div className="ad-photo" key={image.id}>
                    <Image
                      unoptimized
                      width={320}
                      height={240}
                      src={resolveMediaUrl(image.imageUrl) ?? "/icons/box.svg"}
                      alt="Фото товару"
                    />
                    <small>
                      {image.isMain ? "Головне фото" : "Фото товару"}
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
                      Видалити
                    </Button>
                  </div>
                ))}
                {files.map((file, i) => (
                  <div className="ad-photo" key={i}>
                    <small>{file.name}</small>
                    <Button
                      tone="icon"
                      onClick={() =>
                        setFiles(files.filter((_, index) => index !== i))
                      }
                    >
                      Прибрати
                    </Button>
                  </div>
                ))}
              </div>
              <label className="ad-upload">
                <Icon name="upload" />
                <input
                  type="file"
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
                      action.setError("Дозволено до 8 фото розміром до 5 МБ.");
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
          title="Нова характеристика"
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
          <Field label="Назва">
            <input
              value={attributeName}
              onChange={(e) => setAttributeName(e.target.value)}
              maxLength={200}
            />
          </Field>
          <Field label="Одиниця виміру">
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

"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import {
  ActionLink,
  Alert,
  Badge,
  Button,
  Card,
  Feedback,
  Field,
  Filters,
  Hero,
  Loading,
  Pagination,
  Table,
  useAction,
  label,
} from "@/components/admin/ui";
import { date, useResource } from "./api";
import type { Lookup, Paged, Product, Promotion } from "./types";
const fresh = (): Promotion => ({
  id: "",
  name: "",
  description: "",
  type: "PERCENTAGE",
  status: "DRAFT",
  startAt: new Date().toISOString(),
  endAt: new Date(Date.now() + 30 * 86400000).toISOString(),
  discountValue: 10,
  maximumDiscount: null,
  minimumOrderAmount: null,
  productId: null,
  categoryId: null,
  brandId: null,
  sellerId: null,
  coupons: [{ code: "", usageLimit: 0, usageLimitPerUser: 0, active: true }],
});
const localInput = (value: string) => {
  const d = new Date(value);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};
export default function Promotions({
  id,
  create = false,
}: {
  id?: string;
  create?: boolean;
}) {
  const params = useSearchParams(),
    list = useResource<Paged<Promotion>>(
      !id && !create ? "promotions?" + params : null,
    ),
    detail = useResource<Promotion>(id ? "promotions/" + id : null);
  const [edited, setModel] = useState<Promotion | null>(create ? fresh : null),
    action = useAction();
  const options = useResource<{
    categories: Lookup[];
    brands: Lookup[];
    sellers: Lookup[];
  }>(create || id ? "catalog/filter-options" : null);
  const [productSearch, setProductSearch] = useState("");
  const products = useResource<Paged<Product>>(
    create || id
      ? "catalog/products?size=100&search=" + encodeURIComponent(productSearch)
      : null,
  );
  const model = edited ?? detail.data;
  function change<K extends keyof Promotion>(field: K, value: Promotion[K]) {
    setModel({ ...model!, [field]: value });
  }
  async function save() {
    if (!model) return;
    const result = await action.run<Promotion>(
      id ? "promotions/" + id : "promotions",
      { ...model, expectedVersion: model.version ?? null },
      id ? "PUT" : "POST",
    );
    if (result) {
      setModel(result);
      if (!id) window.location.assign("/admin/loyalty/" + result.id);
    }
  }
  return (
    <>
      <Hero
        title={
          create ? "Нова акція" : id ? "Редактор акції" : "Акції та промокоди"
        }
        description="Керуйте знижками, термінами та умовами застосування."
        action={
          !create &&
          !id && (
            <ActionLink href="/admin/loyalty/new">Створити акцію</ActionLink>
          )
        }
      />
      <Alert message={list.error || detail.error || options.error} />
      <Feedback action={action} />
      {!id && !create ? (
        <Card>
          <Filters
            statuses={["DRAFT", "SCHEDULED", "ACTIVE", "FINISHED", "CANCELLED"]}
          />
          {list.loading ? (
            <Loading />
          ) : (
            list.data && (
              <>
                <Table
                  rows={list.data.content}
                  columns={[
                    {
                      title: "Акція",
                      render: (p) => (
                        <Link
                          className="treba-admin-text-link"
                          href={`/admin/loyalty/${p.id}`}
                        >
                          {p.name}
                          <small>
                            {p.coupons.map((c) => c.code).join(", ")}
                          </small>
                        </Link>
                      ),
                    },
                    {
                      title: "Статус",
                      render: (p) => <Badge value={p.status} />,
                    },
                    {
                      title: "Знижка",
                      render: (p) =>
                        `${p.discountValue}${p.type === "PERCENTAGE" ? "%" : p.type === "FREE_SHIPPING" ? " · Доставка" : " ₴"}`,
                    },
                    {
                      title: "Період",
                      render: (p) => (
                        <>
                          {date(p.startAt)}
                          <small>до {date(p.endAt)}</small>
                        </>
                      ),
                    },
                  ]}
                />
                <Pagination data={list.data} />
              </>
            )
          )}
        </Card>
      ) : !model ? (
        <Loading />
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void save();
          }}
        >
          <Card title="Умови акції">
            <div className="treba-admin-form-grid">
              <Field label="Назва *" wide>
                <input
                  value={model.name}
                  required
                  maxLength={255}
                  onChange={(e) => change("name", e.target.value)}
                />
              </Field>
              <Field label="Опис" wide>
                <textarea
                  value={model.description}
                  maxLength={4000}
                  onChange={(e) => change("description", e.target.value)}
                />
              </Field>
              <Field label="Тип знижки">
                <select
                  value={model.type}
                  onChange={(e) => change("type", e.target.value)}
                >
                  <option value="PERCENTAGE">Відсоткова</option>
                  <option value="FIXED_AMOUNT">Фіксована сума</option>
                </select>
              </Field>
              <Field label="Статус">
                <select
                  value={model.status}
                  onChange={(e) => change("status", e.target.value)}
                >
                  {[
                    "DRAFT",
                    "SCHEDULED",
                    "ACTIVE",
                    "FINISHED",
                    "CANCELLED",
                  ].map((s) => (
                    <option key={s} value={s}>
                      {label(s)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Початок (час вашого пристрою)">
                <input
                  type="datetime-local"
                  required
                  value={localInput(model.startAt)}
                  onChange={(e) => {
                    if (e.target.value)
                      change("startAt", new Date(e.target.value).toISOString());
                  }}
                />
              </Field>
              <Field label="Завершення (час вашого пристрою)">
                <input
                  type="datetime-local"
                  required
                  value={localInput(model.endAt)}
                  onChange={(e) => {
                    if (e.target.value)
                      change("endAt", new Date(e.target.value).toISOString());
                  }}
                />
              </Field>
              <Field label="Значення знижки">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={model.discountValue}
                  onChange={(e) =>
                    change("discountValue", Number(e.target.value))
                  }
                />
              </Field>
              <Field label="Максимальна знижка, ₴">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={model.maximumDiscount ?? ""}
                  onChange={(e) =>
                    change(
                      "maximumDiscount",
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                />
              </Field>
              <Field label="Мінімальна сума замовлення, ₴">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={model.minimumOrderAmount ?? ""}
                  onChange={(e) =>
                    change(
                      "minimumOrderAmount",
                      e.target.value ? Number(e.target.value) : null,
                    )
                  }
                />
              </Field>
              <Field label="Пошук товару">
                <input
                  value={productSearch}
                  placeholder="Назва або SKU"
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </Field>
              <Field label="Конкретний товар">
                <select
                  value={model.productId ?? ""}
                  onChange={(e) => change("productId", e.target.value || null)}
                >
                  <option value="">Усі відповідні товари</option>
                  {model.productId &&
                    !products.data?.content.some(
                      (p) => p.id === model.productId,
                    ) && <option value={model.productId}>Обраний товар</option>}
                  {products.data?.content.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} · {p.sku}
                    </option>
                  ))}
                </select>
              </Field>
              {(
                [
                  ["categoryId", "Категорія", options.data?.categories],
                  ["brandId", "Бренд", options.data?.brands],
                  ["sellerId", "Продавець", options.data?.sellers],
                ] as [
                  "categoryId" | "brandId" | "sellerId",
                  string,
                  Lookup[] | undefined,
                ][]
              ).map(([key, title, values]) => (
                <Field key={key} label={title}>
                  <select
                    value={model[key] ?? ""}
                    onChange={(e) => change(key, e.target.value || null)}
                  >
                    <option value="">Без обмеження</option>
                    {values?.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </Field>
              ))}
            </div>
          </Card>
          <Card title="Промокоди">
            {model.coupons.map((coupon, i) => (
              <div className="treba-admin-editor-row" key={coupon.id ?? i}>
                <Field label="Код *">
                  <input
                    value={coupon.code}
                    readOnly={!!coupon.id}
                    pattern="[A-Za-z0-9_-]+"
                    required
                    onChange={(e) =>
                      change(
                        "coupons",
                        model.coupons.map((c, index) =>
                          index === i ? { ...c, code: e.target.value } : c,
                        ),
                      )
                    }
                  />
                </Field>
                <Field label="Загальний ліміт (0 — без ліміту)">
                  <input
                    type="number"
                    min="0"
                    value={coupon.usageLimit}
                    onChange={(e) =>
                      change(
                        "coupons",
                        model.coupons.map((c, index) =>
                          index === i
                            ? { ...c, usageLimit: Number(e.target.value) }
                            : c,
                        ),
                      )
                    }
                  />
                </Field>
                <Field label="На покупця (0 — без ліміту)">
                  <input
                    type="number"
                    min="0"
                    value={coupon.usageLimitPerUser}
                    onChange={(e) =>
                      change(
                        "coupons",
                        model.coupons.map((c, index) =>
                          index === i
                            ? {
                                ...c,
                                usageLimitPerUser: Number(e.target.value),
                              }
                            : c,
                        ),
                      )
                    }
                  />
                </Field>
                <label className="treba-admin-check">
                  <input
                    type="checkbox"
                    checked={coupon.active}
                    onChange={(e) =>
                      change(
                        "coupons",
                        model.coupons.map((c, index) =>
                          index === i ? { ...c, active: e.target.checked } : c,
                        ),
                      )
                    }
                  />
                  Активний
                </label>
                {coupon.usedCount != null && (
                  <span className="treba-admin-note">
                    Використано: {coupon.usedCount}
                  </span>
                )}
              </div>
            ))}
            <div className="treba-admin-actions">
              <Button
                tone="secondary"
                icon="plus"
                onClick={() =>
                  change("coupons", [
                    ...model.coupons,
                    {
                      code: "",
                      usageLimit: 0,
                      usageLimitPerUser: 0,
                      active: true,
                    },
                  ])
                }
              >
                Додати промокод
              </Button>
            </div>
            <p className="treba-admin-note">
              Збережений код не перейменовується. Щоб припинити його
              використання, вимкніть активність.
            </p>
          </Card>
          <div className="treba-admin-actions">
            <Button type="submit" icon="check" disabled={action.busy}>
              Зберегти акцію
            </Button>
            <Link className="treba-admin-button secondary" href="/admin/loyalty">
              До списку
            </Link>
          </div>
        </form>
      )}
    </>
  );
}

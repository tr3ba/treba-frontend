"use client";
import { useAdminI18n } from "@/features/admin/i18n/provider";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Card,
  Feedback,
  Field,
  Hero,
  Table,
  useAction,
} from "@/components/admin/ui";
import { useResource } from "./api";
import type {
  AttributeDefinition,
  ImportJob,
  ImportPreview,
  Lookup,
} from "./types";
export default function Imports() {
  const { t } = useAdminI18n();
  const jobs = useResource<ImportJob[]>("imports/queue", 3000),
    options = useResource<{
      categories: Lookup[];
      brands: Lookup[];
      stores: Lookup[];
      canClassifyImports: boolean;
    }>("imports/options"),
    action = useAction(jobs.reload);
  const [urls, setUrls] = useState(""),
    [categoryId, setCategoryId] = useState(""),
    [previewId, setPreviewId] = useState<string | null>(null),
    [brandName, setBrandName] = useState(""),
    [newCategory, setNewCategory] = useState("");
  const preview = useResource<ImportPreview>(
      previewId ? "imports/" + previewId : null,
    ),
    definitions = useResource<AttributeDefinition[]>(
      preview.data?.categoryId
        ? "catalog/attributes?categoryId=" + preview.data.categoryId
        : null,
    );
  async function submit(form: FormData) {
    if (!preview.data) return;
    const fields = Object.fromEntries(form);
    const attributes = (definitions.data ?? []).flatMap((d) => {
      const values = form
        .getAll("attr:" + d.id)
        .map(String)
        .filter(Boolean);
      return values.map((value) => ({
        attributeId: d.id,
        ...(d.options.length
          ? { optionId: value }
          : d.type.toUpperCase() === "NUMBER"
            ? { numberValue: Number(value) }
            : ["BOOL", "BOOLEAN"].includes(d.type.toUpperCase())
              ? { boolValue: value === "true" }
              : { stringValue: value }),
      }));
    });
    const result = await action.run<{
      productId: string;
    }>(`imports/${previewId}/submit`, {
      ...fields,
      price: Number(fields.price),
      stockQuantity: Number(fields.stockQuantity),
      duplicateConfirmed: form.has("duplicateConfirmed"),
      attributes,
    });
    if (result)
      window.location.assign(`/admin/products/${result.productId}/edit`);
  }
  return (
    <>
      <Hero
        title={t("Імпорт товарів")}
        description={t(
          "Додайте посилання, перевірте дані та створіть картку у своєму магазині.",
        )}
      />
      <Alert message={jobs.error || options.error || preview.error} />
      <Feedback action={action} />
      <Card icon="file" title={t("Посилання на товари")}>
        <Field label={t("Кожне посилання з нового рядка, до 20 за раз")}>
          <textarea
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            rows={4}
            placeholder="https://…"
          />
        </Field>
        <Field label={t("Категорія")}>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">{t("Автоматичне визначення")}</option>
            {options.data?.categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="treba-admin-actions">
          <Button
            icon="upload"
            disabled={action.busy || !urls.trim()}
            onClick={() =>
              void action.run("imports/queue", {
                items: urls
                  .split(/\r?\n/)
                  .map((u) => u.trim())
                  .filter(Boolean)
                  .map((url) => ({ url, categoryId: categoryId || null })),
              })
            }
          >
            {t("Додати до черги")}
          </Button>
        </div>
      </Card>
      <Card icon="file" title={t("Черга імпорту")}>
        <Table
          rows={jobs.data ?? []}
          columns={[
            {
              title: t("Джерело"),
              render: (j) => (
                <div
                  style={{
                    maxWidth: 350,
                    whiteSpace: "normal",
                    overflowWrap: "anywhere",
                  }}
                >
                  {j.sourceUrl}
                </div>
              ),
            },
            {
              title: t("Статус"),
              render: (j) => (
                <>
                  <Badge value={j.status} />
                  <small>{j.error}</small>
                </>
              ),
            },
            {
              title: t("Дії"),
              render: (j) => (
                <div className="treba-admin-actions">
                  {j.previewId && (
                    <Button
                      icon="shield"
                      tone="secondary"
                      onClick={() => setPreviewId(j.previewId!)}
                    >
                      {t("Перевірити")}
                    </Button>
                  )}
                  {j.status === "FAILED" && (
                    <Button
                      tone="secondary"
                      disabled={action.busy}
                      onClick={() =>
                        void action.run(
                          `imports/queue/${j.id}/retry?${categoryId ? "categoryId=" + categoryId : "resetCategory=true"}`,
                        )
                      }
                    >
                      {t("Повторити")}
                    </Button>
                  )}
                  {j.productId && (
                    <Link
                      className="treba-admin-text-link"
                      href={`/admin/products/${j.productId}/edit`}
                    >
                      {t("Відкрити товар →")}
                    </Link>
                  )}
                </div>
              ),
            },
          ]}
        />
      </Card>
      {preview.data && (
        <Card icon="file" title={t("Перевірка імпортованого товару")}>
          <div className="treba-admin-photo-grid">
            {preview.data.images.map((image, i) => (
              <div className="treba-admin-photo" key={i}>
                <Image
                  unoptimized
                  width={320}
                  height={240}
                  src={image}
                  alt={t("Фото з джерела")}
                />
              </div>
            ))}
          </div>
          <p className="treba-admin-note">
            {t("Категорія: ")}
            {preview.data.categoryName}
            {t(" · Бренд:")} {preview.data.brandName}
          </p>
          {preview.data.canClassifyCategory && (
            <div className="treba-admin-editor-row">
              <Field label={t("Категорія TREBA")}>
                <select
                  value={categoryId || preview.data.categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                >
                  {options.data?.categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Button
                icon="check"
                tone="secondary"
                onClick={() =>
                  void action
                    .run(
                      `imports/${previewId}/category`,
                      { categoryId: categoryId || preview.data!.categoryId },
                      "PUT",
                    )
                    .then(() => preview.reload())
                }
              >
                {t("Застосувати категорію")}
              </Button>
              <Field label={t("Нова підкатегорія")}>
                <input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
              </Field>
              <Button
                icon="plus"
                tone="secondary"
                disabled={!newCategory || !categoryId}
                onClick={() =>
                  void action
                    .run(`imports/${previewId}/category`, {
                      name: newCategory,
                      parentId: categoryId,
                    })
                    .then(() => preview.reload())
                }
              >
                {t("Створити підкатегорію")}
              </Button>
            </div>
          )}
          <form key={preview.data.id + preview.data.categoryId} action={submit}>
            <div className="treba-admin-form-grid">
              <Field label={t("Назва *")} wide>
                <input name="name" defaultValue={preview.data.name} required />
              </Field>
              <Field label={t("Опис")} wide>
                <textarea
                  name="description"
                  defaultValue={preview.data.description}
                  rows={7}
                />
              </Field>
              <Field label={t("Магазин *")}>
                <select name="storeId" required>
                  {options.data?.stores.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("Бренд *")}>
                <select
                  name="brandId"
                  required
                  defaultValue={preview.data.brandId ?? ""}
                >
                  <option value="">{t("Оберіть…")}</option>
                  {options.data?.brands.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="SKU *">
                <input name="sku" required />
              </Field>
              <Field label={t("Артикул виробника")}>
                <input
                  name="manufacturerPartNumber"
                  defaultValue={preview.data.manufacturerPartNumber}
                />
              </Field>
              <Field label={t("Штрихкод")}>
                <input name="barcode" defaultValue={preview.data.barcode} />
              </Field>
              <Field label={t("Ціна *")}>
                <input
                  name="price"
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  defaultValue={preview.data.sourcePrice ?? ""}
                />
              </Field>
              <Field label={t("Залишок")}>
                <input
                  name="stockQuantity"
                  type="number"
                  min="0"
                  required
                  defaultValue={0}
                />
              </Field>
              {definitions.data?.map((d) => (
                <Field key={d.id} label={d.name}>
                  {d.options.length ? (
                    <select
                      name={"attr:" + d.id}
                      multiple={d.type.toUpperCase() === "MULTI_SELECT"}
                      required={d.isRequired}
                    >
                      <option value="">{t("Оберіть значення")}</option>
                      {d.options.map((o) => (
                        <option key={o.id} value={o.id}>
                          {o.name}
                        </option>
                      ))}
                    </select>
                  ) : ["BOOL", "BOOLEAN"].includes(d.type.toUpperCase()) ? (
                    <select name={"attr:" + d.id} required={d.isRequired}>
                      <option value="">{t("Не вказано")}</option>
                      <option value="true">{t("Так")}</option>
                      <option value="false">{t("Ні")}</option>
                    </select>
                  ) : (
                    <input
                      name={"attr:" + d.id}
                      required={d.isRequired}
                      type={
                        d.type.toUpperCase() === "NUMBER"
                          ? "number"
                          : d.type.toUpperCase() === "DATE"
                            ? "date"
                            : "text"
                      }
                      step={
                        d.type.toUpperCase() === "NUMBER" ? "any" : undefined
                      }
                      defaultValue={
                        preview.data?.characteristics.find(
                          (c) => c.name.toLowerCase() === d.name.toLowerCase(),
                        )?.value ?? ""
                      }
                    />
                  )}
                </Field>
              ))}
            </div>
            {preview.data.duplicates.length > 0 && (
              <>
                <Alert
                  message={t(
                    "Знайдено схожі товари. Перевірте, чи не створюєте дублікат.",
                  )}
                />
                {preview.data.duplicates.map((d) => (
                  <p className="treba-admin-note" key={d.id}>
                    {d.name} · {d.storeName} · {d.reason}
                  </p>
                ))}
                <label className="treba-admin-check">
                  <input type="checkbox" name="duplicateConfirmed" required />
                  {t("Я перевірив схожі товари та підтверджую створення")}
                </label>
              </>
            )}
            <div className="treba-admin-actions">
              <Button
                icon="plus"
                type="submit"
                disabled={action.busy || !!preview.data.productId}
              >
                {t("Створити товар")}
              </Button>
            </div>
          </form>
          <div className="treba-admin-editor-row">
            <Field label={t("Бренду немає у списку?")}>
              <input
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder={t("Назва нового бренду")}
              />
            </Field>
            <Button
              icon="plus"
              tone="secondary"
              disabled={!brandName || action.busy}
              onClick={() =>
                void action
                  .run(`imports/${previewId}/brand`, { name: brandName })
                  .then(() => options.reload())
              }
            >
              {t("Створити бренд")}
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}

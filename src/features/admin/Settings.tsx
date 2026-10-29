"use client";
import { useAdminI18n } from "@/features/admin/i18n/provider";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import Icon from "@/components/admin/Icon";
import {
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
import { visibleCategories } from "./category-tree";
import { useResource } from "./api";
import type { Category, Change, Lookup, Paged, User } from "./types";
export default function Settings({ section }: { section?: string }) {
  const { t } = useAdminI18n();
  if (section === "features") return <Features />;
  if (section === "staff") return <Staff />;
  if (section === "audit") return <Audit />;
  if (section === "telegram") return <Telegram />;
  return (
    <>
      <Hero
        title={t("Налаштування")}
        description={t("Доступи, можливості та інтеграції маркетплейсу.")}
      />
      <div className="treba-admin-settings-grid">
        {[
          [
            "features",
            t("Функції"),
            t("Увімкнення та вимкнення можливостей системи."),
            "layers",
          ],
          [
            "staff",
            t("Співробітники та ролі"),
            t("Облікові записи та права команди."),
            "users",
          ],
          [
            "telegram",
            t("Telegram та категорії"),
            t("Відповідність зовнішніх категорій каталогу TREBA."),
            "chat",
          ],
          [
            "audit",
            t("Журнал аудиту"),
            t("Історія дій співробітників та змін записів."),
            "clock",
          ],
        ].map(([path, title, description, icon]) => (
          <Link
            className="treba-admin-setting-link"
            key={path}
            href={"/admin/settings/" + path}
          >
            <Icon name={icon} size={24} />
            <div>
              <h2>{title}</h2>
              <p>{description}</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
function Features() {
  const { date, t } = useAdminI18n();
  const resource = useResource<
      {
        key: string;
        enabled: boolean;
        version: string;
        updatedAt?: string;
      }[]
    >("settings/features"),
    action = useAction(resource.reload),
    [confirm, setConfirm] = useState<{
      key: string;
      enabled: boolean;
      version: string;
    } | null>(null);
  return (
    <>
      <Hero
        title={t("Функції системи")}
        description={t(
          "Зміни застосовуються на сервері та записуються до журналу аудиту.",
        )}
      />
      <Alert message={resource.error} />
      <Feedback action={action} />
      {resource.loading ? (
        <Loading />
      ) : (
        resource.data?.map((f) => (
          <Card
            icon="file"
            key={f.key}
            title={
              f.key === "support.chat-deletion" ? t("Видалення чатів") : f.key
            }
          >
            <p className="treba-admin-note">
              {t(
                "Дозволяє адміністраторам і менеджерам переміщувати чати в кошик. Історія зберігається, відновлення залишається доступним.",
              )}
            </p>
            <div className="treba-admin-actions">
              <Badge value={f.enabled ? "ACTIVE" : "DRAFT"} />
              <Button
                icon="check"
                tone="secondary"
                disabled={action.busy}
                onClick={() => setConfirm(f)}
              >
                {f.enabled ? t("Вимкнути") : t("Увімкнути")}
              </Button>
            </div>
            <small className="treba-admin-note">
              {t("Оновлено: ")}
              {date(f.updatedAt)}
            </small>
          </Card>
        ))
      )}
      {confirm && (
        <Confirm
          error={action.error}
          title={t("Змінити функцію системи?")}
          busy={action.busy}
          onClose={() => setConfirm(null)}
          onConfirm={() =>
            void action
              .run(
                `settings/features/${confirm.key}`,
                { enabled: !confirm.enabled, expectedVersion: confirm.version },
                "PUT",
              )
              .then((result) => {
                if (result !== undefined) setConfirm(null);
              })
          }
        >
          <p>
            {confirm.key}: {confirm.enabled ? t("вимкнути") : t("увімкнути")}
          </p>
        </Confirm>
      )}
    </>
  );
}
function Staff() {
  const { t, label } = useAdminI18n();
  const params = useSearchParams(),
    resource = useResource<Paged<User>>("settings/staff?" + params),
    action = useAction(resource.reload),
    [create, setCreate] = useState(false),
    [edit, setEdit] = useState<User | null>(null),
    [role, setRole] = useState("Manager"),
    [blocked, setBlocked] = useState(false);
  return (
    <>
      <Hero
        title={t("Співробітники та ролі")}
        description={t("Доступ команди до робочого простору.")}
        action={
          <Button icon="plus" onClick={() => setCreate(true)}>
            {t("Додати співробітника")}
          </Button>
        }
      />
      <Alert message={resource.error} />
      <Feedback action={action} />
      <Card>
        <Filters>
          <select
            name="role"
            aria-label={t("Роль")}
            defaultValue={params.get("role") ?? ""}
          >
            <option value="">{t("Усі ролі")}</option>
            {["Administrator", "Manager", "Moderator"].map((r) => (
              <option key={r} value={r}>
                {label(r)}
              </option>
            ))}
          </select>
        </Filters>
        {resource.loading ? (
          <Loading />
        ) : (
          resource.data && (
            <>
              <Table
                rows={resource.data.content}
                columns={[
                  {
                    title: t("Співробітник"),
                    render: (u) => (
                      <>
                        <strong>
                          {u.firstName} {u.lastName}
                        </strong>
                        <small>{u.email}</small>
                      </>
                    ),
                  },
                  { title: t("Роль"), render: (u) => label(u.role) },
                  {
                    title: t("Статус"),
                    render: (u) => <Badge value={u.status} />,
                  },
                  {
                    title: t("Доступ"),
                    render: (u) => (
                      <Button
                        icon="edit"
                        tone="secondary"
                        onClick={() => {
                          setEdit(u);
                          setRole(u.role);
                          setBlocked(u.status === "BLOCKED");
                        }}
                      >
                        {t("Змінити")}
                      </Button>
                    ),
                  },
                ]}
              />
              <Pagination data={resource.data} />
            </>
          )
        )}
      </Card>
      {create && (
        <Confirm
          error={action.error}
          title={t("Новий співробітник")}
          onClose={() => setCreate(false)}
          onConfirm={() => {
            document.getElementById("staff-create-submit")?.click();
          }}
          busy={action.busy}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void action
                .run(
                  "settings/staff",
                  Object.fromEntries(new FormData(e.currentTarget)),
                )
                .then((result) => {
                  if (result !== undefined) setCreate(false);
                });
            }}
          >
            <div className="treba-admin-form-grid">
              {[
                ["email", "Email", "email"],
                ["password", t("Пароль (від 12 символів)"), "password"],
                ["firstName", t("Ім’я"), "text"],
                ["lastName", t("Прізвище"), "text"],
              ].map(([name, title, type]) => (
                <Field key={name} label={title}>
                  <input
                    name={name}
                    type={type}
                    required
                    minLength={name === "password" ? 12 : undefined}
                  />
                </Field>
              ))}
              <Field label={t("Роль")}>
                <select name="role">
                  {["Manager", "Moderator", "Administrator"].map((r) => (
                    <option key={r} value={r}>
                      {label(r)}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <button id="staff-create-submit" hidden type="submit" />
            <Feedback action={action} />
          </form>
        </Confirm>
      )}
      {edit && (
        <Confirm
          error={action.error}
          title={t("Змінити доступ співробітника")}
          busy={action.busy}
          onClose={() => setEdit(null)}
          onConfirm={() =>
            void action
              .run(`settings/staff/${edit.id}/access`, { role, blocked }, "PUT")
              .then((result) => {
                if (result !== undefined) setEdit(null);
              })
          }
        >
          <p>{edit.email}</p>
          <Field label={t("Роль")}>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              {["Manager", "Moderator", "Administrator"].map((r) => (
                <option key={r} value={r}>
                  {label(r)}
                </option>
              ))}
            </select>
          </Field>
          <label className="treba-admin-check">
            <input
              type="checkbox"
              checked={blocked}
              onChange={(e) => setBlocked(e.target.checked)}
            />
            {t("Заблокувати доступ")}
          </label>
        </Confirm>
      )}
    </>
  );
}
function Audit() {
  const { date, t } = useAdminI18n();
  const params = useSearchParams(),
    resource = useResource<
      Paged<{
        id: string;
        actorName: string;
        actorRole: string;
        action: string;
        entityType: string;
        entityName: string;
        occurredAt: string;
        changes: Change[];
      }>
    >("settings/audit?" + params);
  return (
    <>
      <Hero
        title={t("Журнал аудиту")}
        description={t("Історія адміністративних дій та змін даних.")}
      />
      <Alert message={resource.error} />
      <Card>
        <Filters>
          <input
            name="from"
            type="date"
            aria-label={t("Від дати")}
            defaultValue={params.get("from") ?? ""}
          />
          <input
            name="to"
            type="date"
            aria-label={t("До дати")}
            defaultValue={params.get("to") ?? ""}
          />
          <input
            name="entityType"
            aria-label={t("Тип запису")}
            placeholder={t("Тип запису")}
            defaultValue={params.get("entityType") ?? ""}
          />
        </Filters>
        {resource.loading ? (
          <Loading />
        ) : (
          resource.data && (
            <>
              <Table
                rows={resource.data.content}
                columns={[
                  {
                    title: t("Співробітник"),
                    render: (r) => (
                      <>
                        {r.actorName}
                        <small>{r.actorRole}</small>
                      </>
                    ),
                  },
                  {
                    title: t("Дія"),
                    render: (r) => (
                      <>
                        {r.action}
                        <small>
                          {r.entityType} · {r.entityName}
                        </small>
                      </>
                    ),
                  },
                  {
                    title: t("Зміни"),
                    render: (r) => (
                      <details>
                        <summary>
                          {r.changes.length}
                          {t(" змін")}
                        </summary>
                        {r.changes.map((c, i) => (
                          <div className="treba-admin-note" key={i}>
                            <b>{c.field}</b>
                            <div className="treba-admin-comparison">
                              <pre>{c.before ?? "—"}</pre>
                              <pre>{c.after ?? "—"}</pre>
                            </div>
                          </div>
                        ))}
                      </details>
                    ),
                  },
                  { title: t("Час"), render: (r) => date(r.occurredAt) },
                ]}
              />
              <Pagination data={resource.data} />
            </>
          )
        )}
      </Card>
    </>
  );
}
function Telegram() {
  const { t } = useAdminI18n();
  const resource = useResource<
      {
        id: string;
        externalKey: string;
        categoryId: string;
        categoryName: string;
      }[]
    >("telegram/mappings"),
    categories = useResource<Lookup[]>("catalog/categories"),
    action = useAction(resource.reload);
  return (
    <>
      <Hero
        title={t("Telegram та категорії")}
        description={t("Зіставлення зовнішніх категорій з каталогом TREBA.")}
      />
      <Alert message={resource.error || categories.error} />
      <Feedback action={action} />
      <Card icon="file" title={t("Додати відповідність")}>
        <form
          action={(form) => {
            void action.run(
              "telegram/mappings",
              Object.fromEntries(form),
              "PUT",
            );
          }}
        >
          <div className="treba-admin-form-grid">
            <Field label={t("Ключ зовнішньої категорії")}>
              <input
                name="externalKey"
                required
                placeholder={t("c12345 або prom:…")}
              />
            </Field>
            <Field label={t("Категорія TREBA")}>
              <select name="categoryId" required>
                <option value="">{t("Оберіть…")}</option>
                {categories.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="treba-admin-actions">
            <Button icon="save" type="submit" disabled={action.busy}>
              {t("Зберегти відповідність")}
            </Button>
          </div>
        </form>
      </Card>
      <Card icon="file" title={t("Наявні відповідності")}>
        {resource.loading ? (
          <Loading />
        ) : (
          <Table
            rows={resource.data ?? []}
            columns={[
              { title: t("Зовнішній ключ"), render: (r) => r.externalKey },
              { title: t("Категорія TREBA"), render: (r) => r.categoryName },
            ]}
          />
        )}
      </Card>
    </>
  );
}
export function Categories() {
  const { t } = useAdminI18n();
  const resource = useResource<Category[]>("categories"),
    action = useAction(resource.reload),
    [edit, setEdit] = useState<
      | (Partial<Category> & {
          parentId?: string;
        })
      | null
    >(null),
    [move, setMove] = useState<Category | null>(null),
    [parent, setParent] = useState(""),
    [search, setSearch] = useState(""),
    [expanded, setExpanded] = useState<Set<string>>(new Set());
  const flat: (Category & {
    depth: number;
  })[] = [];
  function flatten(rows: Category[], depth = 0) {
    for (const row of rows) {
      flat.push({ ...row, depth });
      flatten(row.children ?? [], depth + 1);
    }
  }
  flatten(resource.data ?? []);
  const visible = visibleCategories(resource.data ?? [], expanded, search);
  return (
    <>
      <Hero
        title={t("Категорії")}
        description={t(
          "Структура каталогу, вкладені категорії та їх видимість.",
        )}
        action={
          <Button
            icon="plus"
            onClick={() =>
              setEdit({ name: "", slug: "", isActive: true, sortOrder: 0 })
            }
          >
            {t("Додати категорію")}
          </Button>
        }
      />
      <Alert message={resource.error} />
      <Feedback action={action} />
      <Card>
        <div className="treba-admin-filters">
          <input
            aria-label={t("Знайти категорію")}
            placeholder={t("Знайти категорію…")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {resource.loading ? (
          <Loading />
        ) : (
          visible.map((c) => (
            <div className="treba-admin-tree-row" key={c.id}>
              <div
                className="treba-admin-tree-name"
                style={{ paddingLeft: c.depth * 20 }}
              >
                <Button
                  tone="icon"
                  disabled={!c.children?.length}
                  onClick={() =>
                    setExpanded((current) => {
                      const next = new Set(current);
                      if (next.has(c.id)) next.delete(c.id);
                      else next.add(c.id);
                      return next;
                    })
                  }
                  icon={expanded.has(c.id) ? "layers" : "chevron"}
                >
                  {c.children?.length
                    ? expanded.has(c.id)
                      ? t("Згорнути")
                      : t("Розгорнути")
                    : ""}
                </Button>
                <Icon name="layers" />
                <div>
                  <strong>{c.name}</strong>
                  <small className="treba-admin-note"> /{c.slug}</small>
                </div>
                <Badge value={c.isActive ? "ACTIVE" : "DRAFT"} />
              </div>
              <div className="treba-admin-actions">
                <Button icon="edit" tone="secondary" onClick={() => setEdit(c)}>
                  {t("Редагувати")}
                </Button>
                <Button
                  icon="layers"
                  tone="icon"
                  onClick={() =>
                    setEdit({
                      parentId: c.id,
                      isActive: true,
                      name: "",
                      slug: "",
                      sortOrder: 0,
                    })
                  }
                >
                  {t("+ Підкатегорія")}
                </Button>
                <Button
                  icon="edit"
                  tone="icon"
                  onClick={() => {
                    setMove(c);
                    setParent("");
                  }}
                >
                  {t("Перемістити")}
                </Button>
              </div>
            </div>
          ))
        )}
      </Card>
      {edit && (
        <Confirm
          error={action.error}
          title={edit.id ? t("Редагувати категорію") : t("Нова категорія")}
          busy={action.busy}
          onClose={() => setEdit(null)}
          onConfirm={() => {
            if (!edit.name?.trim() || !edit.slug?.trim()) {
              action.setError(t("Заповніть назву та slug."));
              return;
            }
            void action
              .run(
                edit.id ? `categories/${edit.id}` : "categories",
                edit,
                edit.id ? "PATCH" : "POST",
              )
              .then((result) => {
                if (result !== undefined) setEdit(null);
              });
          }}
        >
          <div className="treba-admin-form-grid">
            <Field label={t("Назва *")}>
              <input
                value={edit.name ?? ""}
                onChange={(e) => setEdit({ ...edit, name: e.target.value })}
              />
            </Field>
            <Field label="Slug *">
              <input
                value={edit.slug ?? ""}
                onChange={(e) => setEdit({ ...edit, slug: e.target.value })}
              />
            </Field>
            <Field label={t("Порядок")}>
              <input
                type="number"
                value={edit.sortOrder ?? 0}
                onChange={(e) =>
                  setEdit({ ...edit, sortOrder: Number(e.target.value) })
                }
              />
            </Field>
            <Field label={t("Посилання на зображення")}>
              <input
                value={edit.imageUrl ?? ""}
                onChange={(e) => setEdit({ ...edit, imageUrl: e.target.value })}
              />
            </Field>
            <Field label={t("Опис")} wide>
              <textarea
                value={edit.description ?? ""}
                onChange={(e) =>
                  setEdit({ ...edit, description: e.target.value })
                }
              />
            </Field>
          </div>
          <label className="treba-admin-check">
            <input
              type="checkbox"
              checked={edit.isActive}
              onChange={(e) => setEdit({ ...edit, isActive: e.target.checked })}
            />
            {t("Активна")}
          </label>
          <Feedback action={action} />
        </Confirm>
      )}
      {move && (
        <Confirm
          error={action.error}
          title={t("Перемістити категорію")}
          onClose={() => setMove(null)}
          busy={action.busy}
          onConfirm={() =>
            void action
              .run(`categories/${move.id}/move`, {
                newParentId: parent || "00000000-0000-0000-0000-000000000000",
              })
              .then((result) => {
                if (result !== undefined) setMove(null);
              })
          }
        >
          <Field label={t("Нова батьківська категорія")}>
            <select value={parent} onChange={(e) => setParent(e.target.value)}>
              <option value="">{t("Коренева категорія")}</option>
              {flat
                .filter((c) => c.id !== move.id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {"—".repeat(c.depth)} {c.name}
                  </option>
                ))}
            </select>
          </Field>
        </Confirm>
      )}
    </>
  );
}

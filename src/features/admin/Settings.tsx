"use client";
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
import { date, useResource } from "./api";
import type { Category, Change, Lookup, Paged, User } from "./types";
export default function Settings({ section }: { section?: string }) {
  if (section === "features") return <Features />;
  if (section === "staff") return <Staff />;
  if (section === "audit") return <Audit />;
  if (section === "telegram") return <Telegram />;
  return (
    <>
      <Hero
        title="Налаштування"
        description="Доступи, можливості та інтеграції маркетплейсу."
      />
      <div className="ad-settings-grid">
        {[
          [
            "features",
            "Функції",
            "Увімкнення та вимкнення можливостей системи.",
            "layers",
          ],
          [
            "staff",
            "Співробітники та ролі",
            "Облікові записи та права команди.",
            "users",
          ],
          [
            "telegram",
            "Telegram та категорії",
            "Відповідність зовнішніх категорій каталогу TREBA.",
            "chat",
          ],
          [
            "audit",
            "Журнал аудиту",
            "Історія дій співробітників та змін записів.",
            "clock",
          ],
        ].map(([path, title, description, icon]) => (
          <Link
            className="ad-setting-link"
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
  const resource =
      useResource<
        { key: string; enabled: boolean; version: string; updatedAt?: string }[]
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
        title="Функції системи"
        description="Зміни застосовуються на сервері та записуються до журналу аудиту."
      />
      <Alert message={resource.error} />
      <Feedback action={action} />
      {resource.loading ? (
        <Loading />
      ) : (
        resource.data?.map((f) => (
          <Card
            key={f.key}
            title={
              f.key === "support.chat-deletion" ? "Видалення чатів" : f.key
            }
          >
            <p className="ad-note">
              Дозволяє адміністраторам і менеджерам переміщувати чати в кошик.
              Історія зберігається, відновлення залишається доступним.
            </p>
            <div className="ad-actions">
              <Badge value={f.enabled ? "ACTIVE" : "DRAFT"} />
              <Button
                tone="secondary"
                disabled={action.busy}
                onClick={() => setConfirm(f)}
              >
                {f.enabled ? "Вимкнути" : "Увімкнути"}
              </Button>
            </div>
            <small className="ad-note">Оновлено: {date(f.updatedAt)}</small>
          </Card>
        ))
      )}
      {confirm && (
        <Confirm
          error={action.error}
          title="Змінити функцію системи?"
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
            {confirm.key}: {confirm.enabled ? "вимкнути" : "увімкнути"}
          </p>
        </Confirm>
      )}
    </>
  );
}
function Staff() {
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
        title="Співробітники та ролі"
        description="Доступ команди до робочого простору."
        action={
          <Button icon="plus" onClick={() => setCreate(true)}>
            Додати співробітника
          </Button>
        }
      />
      <Alert message={resource.error} />
      <Feedback action={action} />
      <Card>
        <Filters>
          <select
            name="role"
            aria-label="Роль"
            defaultValue={params.get("role") ?? ""}
          >
            <option value="">Усі ролі</option>
            {["Administrator", "Manager", "Moderator"].map((r) => (
              <option key={r}>{r}</option>
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
                    title: "Співробітник",
                    render: (u) => (
                      <>
                        <strong>
                          {u.firstName} {u.lastName}
                        </strong>
                        <small>{u.email}</small>
                      </>
                    ),
                  },
                  { title: "Роль", render: (u) => u.role },
                  {
                    title: "Статус",
                    render: (u) => <Badge value={u.status} />,
                  },
                  {
                    title: "Доступ",
                    render: (u) => (
                      <Button
                        tone="secondary"
                        onClick={() => {
                          setEdit(u);
                          setRole(u.role);
                          setBlocked(u.status === "BLOCKED");
                        }}
                      >
                        Змінити
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
          title="Новий співробітник"
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
            <div className="ad-form-grid">
              {[
                ["email", "Email", "email"],
                ["password", "Пароль (від 12 символів)", "password"],
                ["firstName", "Ім’я", "text"],
                ["lastName", "Прізвище", "text"],
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
              <Field label="Роль">
                <select name="role">
                  {["Manager", "Moderator", "Administrator"].map((r) => (
                    <option key={r}>{r}</option>
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
          title="Змінити доступ співробітника"
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
          <Field label="Роль">
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              {["Manager", "Moderator", "Administrator"].map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>
          <label className="ad-check">
            <input
              type="checkbox"
              checked={blocked}
              onChange={(e) => setBlocked(e.target.checked)}
            />
            Заблокувати доступ
          </label>
        </Confirm>
      )}
    </>
  );
}
function Audit() {
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
        title="Журнал аудиту"
        description="Історія адміністративних дій та змін даних."
      />
      <Alert message={resource.error} />
      <Card>
        <Filters>
          <input
            name="from"
            type="date"
            aria-label="Від дати"
            defaultValue={params.get("from") ?? ""}
          />
          <input
            name="to"
            type="date"
            aria-label="До дати"
            defaultValue={params.get("to") ?? ""}
          />
          <input
            name="entityType"
            aria-label="Тип запису"
            placeholder="Тип запису"
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
                    title: "Співробітник",
                    render: (r) => (
                      <>
                        {r.actorName}
                        <small>{r.actorRole}</small>
                      </>
                    ),
                  },
                  {
                    title: "Дія",
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
                    title: "Зміни",
                    render: (r) => (
                      <details>
                        <summary>{r.changes.length} змін</summary>
                        {r.changes.map((c, i) => (
                          <div className="ad-note" key={i}>
                            <b>{c.field}</b>
                            <div className="ad-comparison">
                              <pre>{c.before ?? "—"}</pre>
                              <pre>{c.after ?? "—"}</pre>
                            </div>
                          </div>
                        ))}
                      </details>
                    ),
                  },
                  { title: "Час", render: (r) => date(r.occurredAt) },
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
        title="Telegram та категорії"
        description="Зіставлення зовнішніх категорій з каталогом TREBA."
      />
      <Alert message={resource.error || categories.error} />
      <Feedback action={action} />
      <Card title="Додати відповідність">
        <form
          action={(form) => {
            void action.run(
              "telegram/mappings",
              Object.fromEntries(form),
              "PUT",
            );
          }}
        >
          <div className="ad-form-grid">
            <Field label="Ключ зовнішньої категорії">
              <input
                name="externalKey"
                required
                placeholder="c12345 або prom:…"
              />
            </Field>
            <Field label="Категорія TREBA">
              <select name="categoryId" required>
                <option value="">Оберіть…</option>
                {categories.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="ad-actions">
            <Button type="submit" disabled={action.busy}>
              Зберегти відповідність
            </Button>
          </div>
        </form>
      </Card>
      <Card title="Наявні відповідності">
        {resource.loading ? (
          <Loading />
        ) : (
          <Table
            rows={resource.data ?? []}
            columns={[
              { title: "Зовнішній ключ", render: (r) => r.externalKey },
              { title: "Категорія TREBA", render: (r) => r.categoryName },
            ]}
          />
        )}
      </Card>
    </>
  );
}
export function Categories() {
  const resource = useResource<Category[]>("categories"),
    action = useAction(resource.reload),
    [edit, setEdit] = useState<
      (Partial<Category> & { parentId?: string }) | null
    >(null),
    [move, setMove] = useState<Category | null>(null),
    [parent, setParent] = useState(""),
    [search, setSearch] = useState(""),
    [expanded, setExpanded] = useState<Set<string>>(new Set());
  const flat: (Category & { depth: number })[] = [];
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
        title="Категорії"
        description="Структура каталогу, вкладені категорії та їх видимість."
        action={
          <Button
            icon="plus"
            onClick={() =>
              setEdit({ name: "", slug: "", isActive: true, sortOrder: 0 })
            }
          >
            Додати категорію
          </Button>
        }
      />
      <Alert message={resource.error} />
      <Feedback action={action} />
      <Card>
        <div className="ad-filters">
          <input
            aria-label="Знайти категорію"
            placeholder="Знайти категорію…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {resource.loading ? (
          <Loading />
        ) : (
          visible.map((c) => (
            <div className="ad-tree-row" key={c.id}>
              <div
                className="ad-tree-name"
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
                      ? "Згорнути"
                      : "Розгорнути"
                    : ""}
                </Button>
                <Icon name="layers" />
                <div>
                  <strong>{c.name}</strong>
                  <small className="ad-note"> /{c.slug}</small>
                </div>
                <Badge value={c.isActive ? "ACTIVE" : "DRAFT"} />
              </div>
              <div className="ad-actions">
                <Button tone="secondary" onClick={() => setEdit(c)}>
                  Редагувати
                </Button>
                <Button
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
                  + Підкатегорія
                </Button>
                <Button
                  tone="icon"
                  onClick={() => {
                    setMove(c);
                    setParent("");
                  }}
                >
                  Перемістити
                </Button>
              </div>
            </div>
          ))
        )}
      </Card>
      {edit && (
        <Confirm
          error={action.error}
          title={edit.id ? "Редагувати категорію" : "Нова категорія"}
          busy={action.busy}
          onClose={() => setEdit(null)}
          onConfirm={() => {
            if (!edit.name?.trim() || !edit.slug?.trim()) {
              action.setError("Заповніть назву та slug.");
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
          <div className="ad-form-grid">
            <Field label="Назва *">
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
            <Field label="Порядок">
              <input
                type="number"
                value={edit.sortOrder ?? 0}
                onChange={(e) =>
                  setEdit({ ...edit, sortOrder: Number(e.target.value) })
                }
              />
            </Field>
            <Field label="Посилання на зображення">
              <input
                value={edit.imageUrl ?? ""}
                onChange={(e) => setEdit({ ...edit, imageUrl: e.target.value })}
              />
            </Field>
            <Field label="Опис" wide>
              <textarea
                value={edit.description ?? ""}
                onChange={(e) =>
                  setEdit({ ...edit, description: e.target.value })
                }
              />
            </Field>
          </div>
          <label className="ad-check">
            <input
              type="checkbox"
              checked={edit.isActive}
              onChange={(e) => setEdit({ ...edit, isActive: e.target.checked })}
            />
            Активна
          </label>
          <Feedback action={action} />
        </Confirm>
      )}
      {move && (
        <Confirm
          error={action.error}
          title="Перемістити категорію"
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
          <Field label="Нова батьківська категорія">
            <select value={parent} onChange={(e) => setParent(e.target.value)}>
              <option value="">Коренева категорія</option>
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

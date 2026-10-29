"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useStaff } from "@/components/admin/AdminShell";
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
import { date, useResource } from "./api";
import type {
  Lookup,
  Paged,
  Review,
  Seller,
  SellerApplication,
  User,
} from "./types";

export function Reviews() {
  const params = useSearchParams(),
    resource = useResource<Paged<Review>>("reviews?" + params),
    action = useAction(resource.reload);
  const [selected, setSelected] = useState<{
    review: Review;
    status: string;
  } | null>(null);
  return (
    <>
      <Hero
        title="Відгуки"
        description="Перевіряйте відгуки покупців перед публікацією."
      />
      <Alert message={resource.error} />
      <Feedback action={action} />
      <Card>
        <Filters statuses={["PENDING", "PUBLISHED", "REJECTED"]} />
        {resource.loading ? (
          <Loading />
        ) : (
          resource.data && (
            <>
              <Table
                rows={resource.data.content}
                columns={[
                  {
                    title: "Товар",
                    render: (r) => <strong>{r.productName}</strong>,
                  },
                  {
                    title: "Автор",
                    render: (r) => (
                      <>
                        {r.authorName}
                        <small>
                          {r.authorEmail}
                          {r.verifiedPurchase ? " · Покупку підтверджено" : ""}
                        </small>
                      </>
                    ),
                  },
                  {
                    title: "Оцінка",
                    render: (r) => (
                      <span style={{ color: "#d99b43" }}>{r.rating} ★</span>
                    ),
                  },
                  {
                    title: "Відгук",
                    render: (r) => (
                      <div style={{ maxWidth: 350, whiteSpace: "normal" }}>
                        <strong>{r.title}</strong>
                        <p>{r.comment}</p>
                      </div>
                    ),
                  },
                  {
                    title: "Статус",
                    render: (r) => <Badge value={r.status} />,
                  },
                  {
                    title: "Дії",
                    render: (r) => (
                      <div className="treba-admin-actions">
                        {r.status !== "PUBLISHED" && (
                          <Button
                            tone="secondary"
                            disabled={action.busy}
                            onClick={() =>
                              setSelected({ review: r, status: "PUBLISHED" })
                            }
                          >
                            Опублікувати
                          </Button>
                        )}
                        {r.status !== "REJECTED" && (
                          <Button
                            tone="danger"
                            disabled={action.busy}
                            onClick={() =>
                              setSelected({ review: r, status: "REJECTED" })
                            }
                          >
                            Відхилити
                          </Button>
                        )}
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
      {selected && (
        <Confirm
          error={action.error}
          title={
            selected.status === "PUBLISHED"
              ? "Опублікувати відгук?"
              : "Відхилити відгук?"
          }
          onClose={() => setSelected(null)}
          busy={action.busy}
          onConfirm={() =>
            void action
              .run(
                `reviews/${selected.review.id}/moderate`,
                { status: selected.status },
                "PUT",
              )
              .then((result) => {
                if (result !== undefined) setSelected(null);
              })
          }
        >
          <p>{selected.review.comment}</p>
        </Confirm>
      )}
    </>
  );
}
export function Sellers({
  id,
  create = false,
  applications = false,
}: {
  id?: string;
  create?: boolean;
  applications?: boolean;
}) {
  const staff = useStaff(),
    params = useSearchParams();
  const list = useResource<Seller[]>(
      !id && !create && !applications ? "sellers" : null,
    ),
    detail = useResource<Seller>(id ? "sellers/" + id : null);
  const apps = useResource<Paged<SellerApplication>>(
      applications ? "seller-applications?" + params : null,
    ),
    categories = useResource<Lookup[]>(
      create || (id && staff.role === "Administrator")
        ? "catalog/categories"
        : null,
    );
  const grants = useResource<
    { categoryId: string; name: string; includeDescendants: boolean }[]
  >(
    id && staff.role === "Administrator"
      ? `telegram/sellers/${id}/categories`
      : null,
  );
  const action = useAction(async () => {
    await list.reload();
    await detail.reload();
    await apps.reload();
    await grants.reload();
  });
  const [decision, setDecision] = useState<{
      seller: Seller;
      type: string;
    } | null>(null),
    [application, setApplication] = useState<SellerApplication | null>(null),
    [note, setNote] = useState(""),
    [slug, setSlug] = useState(""),
    [approve, setApprove] = useState(true),
    [allowed, setAllowed] = useState<string[] | null>(null),
    [descendants, setDescendants] = useState<Record<string, boolean>>({});
  async function createSeller(form: FormData) {
    const body = Object.fromEntries(form);
    const result = await action.run<{ sellerId: string }>("sellers", {
      ...body,
      active: form.has("active"),
      allCategories: form.has("allCategories"),
      testSeller: form.has("testSeller"),
      categoryIds: form.getAll("categoryIds"),
    });
    if (result)
      window.location.assign("/admin/sellers/review/" + result.sellerId);
  }
  const visible = (list.data ?? []).filter(
    (s) =>
      (!params.get("search") ||
        s.companyName
          .toLowerCase()
          .includes(params.get("search")!.toLowerCase())) &&
      (!params.get("status") || String(s.status) === params.get("status")),
  );
  return (
    <>
      <Hero
        title={
          create
            ? "Новий продавець"
            : applications
              ? "Заявки продавців"
              : (detail.data?.companyName ?? "Продавці")
        }
        description="Партнери маркетплейсу та доступ до продажів."
        action={
          !create && staff.role === "Administrator" ? (
            <ActionLink href="/admin/sellers/new">Створити продавця</ActionLink>
          ) : undefined
        }
      />
      <Alert
        message={list.error || detail.error || apps.error || grants.error}
      />
      <Feedback action={action} />
      {create ? (
        <Card title="Обліковий запис та магазин">
          <form action={createSeller}>
            <div className="treba-admin-form-grid">
              {[
                ["email", "Email", "email"],
                ["password", "Початковий пароль (від 12 символів)", "password"],
                ["firstName", "Ім’я", "text"],
                ["lastName", "Прізвище", "text"],
                ["companyName", "Назва компанії", "text"],
                ["taxNumber", "ЄДРПОУ / ІПН", "text"],
                ["phone", "Телефон", "tel"],
                ["storeName", "Назва магазину", "text"],
                ["storeSlug", "Адреса магазину (slug)", "text"],
              ].map(([name, title, type]) => (
                <Field key={name} label={title}>
                  <input
                    name={name}
                    type={type}
                    required={!["phone", "taxNumber"].includes(name)}
                    minLength={name === "password" ? 12 : undefined}
                    pattern={
                      name === "storeSlug"
                        ? "[a-z0-9]+(?:-[a-z0-9]+)*"
                        : undefined
                    }
                  />
                </Field>
              ))}
              <Field label="Опис" wide>
                <textarea name="description" maxLength={2000} />
              </Field>
            </div>
            <label className="treba-admin-check">
              <input type="checkbox" name="active" />
              Активувати одразу
            </label>
            <label className="treba-admin-check">
              <input type="checkbox" name="testSeller" />
              Тестовий продавець без ЄДРПОУ / ІПН
            </label>
            <label className="treba-admin-check">
              <input type="checkbox" name="allCategories" defaultChecked />
              Дозволити всі категорії
            </label>
            <Field label="Або виберіть дозволені категорії">
              <select name="categoryIds" multiple size={6}>
                {categories.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="treba-admin-actions">
              <Button type="submit" disabled={action.busy}>
                Створити продавця
              </Button>
            </div>
          </form>
        </Card>
      ) : applications ? (
        <Card>
          <Filters
            statuses={["pending", "approved", "rejected"]}
            search={false}
          />
          {apps.loading ? (
            <Loading />
          ) : (
            apps.data && (
              <>
                <Table
                  rows={apps.data.content}
                  columns={[
                    {
                      title: "Магазин",
                      render: (a) => (
                        <>
                          <strong>{a.storeName}</strong>
                          <small>
                            {a.companyName} · {a.taxNumber}
                          </small>
                        </>
                      ),
                    },
                    {
                      title: "Контакт",
                      render: (a) => (
                        <>
                          {a.contactName}
                          <small>
                            {a.email} · {a.phone}
                          </small>
                        </>
                      ),
                    },
                    {
                      title: "Статус",
                      render: (a) => <Badge value={a.status} />,
                    },
                    {
                      title: "Рішення",
                      render: (a) =>
                        a.status === "pending" ? (
                          <Button
                            tone="secondary"
                            onClick={() => {
                              setApplication(a);
                              setSlug(
                                "shop-" + a.id.replaceAll("-", "").slice(0, 12),
                              );
                              setNote("");
                            }}
                          >
                            Розглянути
                          </Button>
                        ) : (
                          <>
                            {a.reviewNote}
                            {a.sellerId && (
                              <Link
                                className="treba-admin-text-link"
                                href={`/admin/sellers/review/${a.sellerId}`}
                              >
                                Відкрити продавця →
                              </Link>
                            )}
                          </>
                        ),
                    },
                  ]}
                />
                <Pagination data={apps.data} />
              </>
            )
          )}
        </Card>
      ) : id ? (
        detail.loading ? (
          <Loading />
        ) : (
          detail.data && (
            <>
              <Card title="Профіль продавця">
                <div className="treba-admin-detail-list">
                  {[
                    ["Компанія", detail.data.companyName],
                    ["ЄДРПОУ / ІПН", detail.data.taxNumber],
                    ["Email", detail.data.email],
                    ["Телефон", detail.data.phone],
                    ["Створено", date(detail.data.createdAt)],
                  ].map(([title, value]) => (
                    <div key={title}>
                      <dt>{title}</dt>
                      <dd>{value ?? "—"}</dd>
                    </div>
                  ))}
                </div>
                <p className="treba-admin-note">{detail.data.description}</p>
                <Badge
                  value={
                    ["PENDING", "ACTIVE", "SUSPENDED"][detail.data.status] ??
                    String(detail.data.status)
                  }
                />
                <div className="treba-admin-actions">
                  <Button
                    disabled={action.busy}
                    onClick={() =>
                      setDecision({
                        seller: detail.data!,
                        type: detail.data!.status === 1 ? "suspend" : "approve",
                      })
                    }
                  >
                    {detail.data.status === 1 ? "Призупинити" : "Активувати"}
                  </Button>
                </div>
              </Card>
              {staff.role === "Administrator" && (
                <Card title="Дозволені категорії">
                  <Field label="Категорії продавця">
                    <select
                      multiple
                      size={8}
                      value={
                        allowed ?? grants.data?.map((g) => g.categoryId) ?? []
                      }
                      onChange={(e) =>
                        setAllowed(
                          Array.from(e.target.selectedOptions, (o) => o.value),
                        )
                      }
                    >
                      {categories.data?.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  {(allowed ?? grants.data?.map((g) => g.categoryId) ?? []).map(
                    (categoryId) => (
                      <label className="treba-admin-check" key={categoryId}>
                        <input
                          type="checkbox"
                          checked={
                            descendants[categoryId] ??
                            grants.data?.find(
                              (g) => g.categoryId === categoryId,
                            )?.includeDescendants ??
                            true
                          }
                          onChange={(e) =>
                            setDescendants({
                              ...descendants,
                              [categoryId]: e.target.checked,
                            })
                          }
                        />
                        {
                          categories.data?.find((c) => c.id === categoryId)
                            ?.name
                        }{" "}
                        · включати підкатегорії
                      </label>
                    ),
                  )}
                  <div className="treba-admin-actions">
                    <Button
                      disabled={
                        action.busy ||
                        (!allowed && !Object.keys(descendants).length)
                      }
                      onClick={() =>
                        void action.run(
                          `telegram/sellers/${id}/categories`,
                          {
                            grants: (
                              allowed ??
                              grants.data?.map((g) => g.categoryId) ??
                              []
                            ).map((categoryId) => ({
                              categoryId,
                              includeDescendants:
                                descendants[categoryId] ??
                                grants.data?.find(
                                  (g) => g.categoryId === categoryId,
                                )?.includeDescendants ??
                                true,
                            })),
                          },
                          "PUT",
                        )
                      }
                    >
                      Зберегти доступ
                    </Button>
                  </div>
                </Card>
              )}
            </>
          )
        )
      ) : (
        <Card>
          <Filters>
            <select
              name="status"
              aria-label="Статус продавця"
              defaultValue={params.get("status") ?? ""}
            >
              <option value="">Усі статуси</option>
              <option value="0">Очікує</option>
              <option value="1">Активний</option>
              <option value="2">Призупинено</option>
            </select>
          </Filters>
          {list.loading ? (
            <Loading />
          ) : (
            <Table
              rows={visible}
              columns={[
                {
                  title: "Продавець",
                  render: (s) => (
                    <Link
                      className="treba-admin-text-link"
                      href={`/admin/sellers/review/${s.id}`}
                    >
                      {s.companyName}
                      <small>{s.taxNumber}</small>
                    </Link>
                  ),
                },
                {
                  title: "Контакт",
                  render: (s) => (
                    <>
                      {s.email}
                      <small>{s.phone}</small>
                    </>
                  ),
                },
                {
                  title: "Статус",
                  render: (s) => (
                    <Badge
                      value={
                        ["PENDING", "ACTIVE", "SUSPENDED"][s.status] ??
                        String(s.status)
                      }
                    />
                  ),
                },
                { title: "Дата", render: (s) => date(s.createdAt) },
              ]}
            />
          )}
        </Card>
      )}
      {decision && (
        <Confirm
          error={action.error}
          title={
            decision.type === "approve"
              ? "Активувати продавця?"
              : "Призупинити продавця?"
          }
          onClose={() => setDecision(null)}
          busy={action.busy}
          onConfirm={() =>
            void action
              .run(`sellers/${decision.seller.id}/${decision.type}`)
              .then((result) => {
                if (result !== undefined) setDecision(null);
              })
          }
        >
          <p>{decision.seller.companyName}</p>
        </Confirm>
      )}
      {application && (
        <Confirm
          error={action.error}
          title="Рішення щодо заявки"
          busy={action.busy}
          onClose={() => setApplication(null)}
          onConfirm={() =>
            void action
              .run(`seller-applications/${application.id}/review`, {
                version: application.version,
                approve,
                note,
                storeSlug: slug,
                allCategories: true,
              })
              .then((result) => {
                if (result !== undefined) setApplication(null);
              })
          }
        >
          <h3>{application.storeName}</h3>
          <Field label="Рішення">
            <select
              value={String(approve)}
              onChange={(e) => setApprove(e.target.value === "true")}
            >
              <option value="true">Схвалити</option>
              <option value="false">Відхилити</option>
            </select>
          </Field>
          <Field label="Адреса магазину">
            <input value={slug} onChange={(e) => setSlug(e.target.value)} />
          </Field>
          <Field label="Примітка">
            <textarea
              value={note}
              maxLength={2000}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
          <p className="treba-admin-note">
            При схваленні продавець отримає доступ до всіх категорій.
          </p>
        </Confirm>
      )}
    </>
  );
}
export function Users({
  id,
  create = false,
}: {
  id?: string;
  create?: boolean;
}) {
  const params = useSearchParams(),
    list = useResource<Paged<User>>(!id && !create ? "users?" + params : null),
    detail = useResource<User>(id ? "users/" + id : null),
    action = useAction(detail.reload),
    [confirm, setConfirm] = useState(false);
  async function submit(form: FormData) {
    const result = await action.run<User>("users", Object.fromEntries(form));
    if (result) window.location.assign("/admin/users/" + result.id);
  }
  return (
    <>
      <Hero
        title={
          create
            ? "Новий користувач"
            : detail.data
              ? `${detail.data.firstName} ${detail.data.lastName}`
              : "Користувачі"
        }
        description="Облікові записи та контроль доступу."
        action={
          !create && (
            <ActionLink href="/admin/users/create">
              Створити користувача
            </ActionLink>
          )
        }
      />
      <Alert message={list.error || detail.error} />
      <Feedback action={action} />
      {create ? (
        <Card>
          <form action={submit}>
            <div className="treba-admin-form-grid">
              {[
                ["email", "Email", "email"],
                ["firstName", "Ім’я", "text"],
                ["lastName", "Прізвище", "text"],
                ["middleName", "По батькові", "text"],
                ["phone", "Телефон", "tel"],
              ].map(([name, title, type]) => (
                <Field key={name} label={title}>
                  <input
                    name={name}
                    type={type}
                    required={["email", "firstName", "lastName"].includes(name)}
                  />
                </Field>
              ))}
            </div>
            <div className="treba-admin-actions">
              <Button type="submit" disabled={action.busy}>
                Створити
              </Button>
            </div>
          </form>
        </Card>
      ) : id ? (
        detail.loading ? (
          <Loading />
        ) : (
          detail.data && (
            <Card title="Обліковий запис">
              <div className="treba-admin-detail-list">
                {[
                  ["Email", detail.data.email],
                  ["Телефон", detail.data.phone],
                  ["Дата реєстрації", date(detail.data.createdAt)],
                  ["Останній вхід", date(detail.data.lastLoginAt)],
                ].map(([title, value]) => (
                  <div key={title}>
                    <dt>{title}</dt>
                    <dd>{value || "—"}</dd>
                  </div>
                ))}
              </div>
              <div className="treba-admin-actions">
                <Badge value={detail.data.status} />
                <Button
                  tone="danger"
                  disabled={action.busy}
                  onClick={() => setConfirm(true)}
                >
                  {detail.data.status === "BLOCKED"
                    ? "Розблокувати"
                    : "Заблокувати"}
                </Button>
              </div>
              {detail.data.addresses?.map((a) => (
                <p className="treba-admin-note" key={a.id}>
                  {a.city}, {a.street}, {a.building} · {a.recipientName}
                </p>
              ))}
            </Card>
          )
        )
      ) : (
        <Card>
          <Filters statuses={["ACTIVE", "BLOCKED"]} />
          {list.loading ? (
            <Loading />
          ) : (
            list.data && (
              <>
                <Table
                  rows={list.data.content}
                  columns={[
                    {
                      title: "Ім’я",
                      render: (u) => (
                        <Link
                          className="treba-admin-text-link"
                          href={`/admin/users/${u.id}`}
                        >
                          {u.firstName} {u.lastName}
                        </Link>
                      ),
                    },
                    {
                      title: "Контакти",
                      render: (u) => (
                        <>
                          {u.email}
                          <small>{u.phone}</small>
                        </>
                      ),
                    },
                    {
                      title: "Статус",
                      render: (u) => <Badge value={u.status} />,
                    },
                    { title: "Дата", render: (u) => date(u.createdAt) },
                  ]}
                />
                <Pagination data={list.data} />
              </>
            )
          )}
        </Card>
      )}
      {confirm && detail.data && (
        <Confirm
          error={action.error}
          title="Змінити доступ користувача?"
          busy={action.busy}
          onClose={() => setConfirm(false)}
          onConfirm={() =>
            void action
              .run(
                `users/${id}/${detail.data!.status === "BLOCKED" ? "unblock" : "block"}`,
              )
              .then((result) => {
                if (result !== undefined) setConfirm(false);
              })
          }
        >
          <p>{detail.data.email}</p>
        </Confirm>
      )}
    </>
  );
}

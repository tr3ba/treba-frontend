"use client";
import { useAdminI18n } from "@/features/admin/i18n/provider";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { useStaff } from "@/components/admin/AdminShell";
import UserAvatar from "@/components/admin/UserAvatar";
import { roleLabel } from "@/lib/admin";
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
import { useResource } from "./api";
import type {
  Lookup,
  Paged,
  Seller,
  SellerApplication,
  User,
} from "./types";
export { default as Reviews } from "./Reviews";
export function Sellers({
  id,
  create = false,
  applications = false,
}: {
  id?: string;
  create?: boolean;
  applications?: boolean;
}) {
  const { date, t } = useAdminI18n();
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
    {
      categoryId: string;
      name: string;
      includeDescendants: boolean;
    }[]
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
  const permittedCategoryIds =
    allowed ?? grants.data?.map((grant) => grant.categoryId) ?? [];
  const permittedCategoryCount = allowed?.length ?? grants.data?.length;
  async function createSeller(form: FormData) {
    const body = Object.fromEntries(form);
    const result = await action.run<{
      sellerId: string;
    }>("sellers", {
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
            ? t("Новий продавець")
            : applications
              ? t("Заявки продавців")
              : (detail.data?.companyName ?? t("Продавці"))
        }
        description={t("Партнери маркетплейсу та доступ до продажів.")}
        action={
          !create && staff.role === "Administrator" ? (
            <ActionLink href="/admin/sellers/new">
              {t("Створити продавця")}
            </ActionLink>
          ) : undefined
        }
      />
      <Alert
        message={list.error || detail.error || apps.error || grants.error}
      />
      <Feedback action={action} />
      {create ? (
        <Card icon="user" title={t("Обліковий запис та магазин")}>
          <form action={createSeller}>
            <div className="treba-admin-form-grid">
              {[
                ["email", "Email", "email"],
                [
                  "password",
                  t("Початковий пароль (від 12 символів)"),
                  "password",
                ],
                ["firstName", t("Ім’я"), "text"],
                ["lastName", t("Прізвище"), "text"],
                ["companyName", t("Назва компанії"), "text"],
                ["taxNumber", t("ЄДРПОУ / ІПН"), "text"],
                ["phone", t("Телефон"), "tel"],
                ["storeName", t("Назва магазину"), "text"],
                ["storeSlug", t("Адреса магазину (slug)"), "text"],
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
              <Field label={t("Опис")} wide>
                <textarea name="description" maxLength={2000} />
              </Field>
            </div>
            <label className="treba-admin-check">
              <input type="checkbox" name="active" />
              {t("Активувати одразу")}
            </label>
            <label className="treba-admin-check">
              <input type="checkbox" name="testSeller" />
              {t("Тестовий продавець без ЄДРПОУ / ІПН")}
            </label>
            <label className="treba-admin-check">
              <input type="checkbox" name="allCategories" defaultChecked />
              {t("Дозволити всі категорії")}
            </label>
            <Field label={t("Або виберіть дозволені категорії")}>
              <select name="categoryIds" multiple size={6}>
                {categories.data?.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <div className="treba-admin-actions">
              <Button icon="plus" type="submit" disabled={action.busy}>
                {t("Створити продавця")}
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
                      title: t("Магазин"),
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
                      title: t("Контакт"),
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
                      title: t("Статус"),
                      render: (a) => <Badge value={a.status} />,
                    },
                    {
                      title: t("Рішення"),
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
                            {t("Розглянути")}
                          </Button>
                        ) : (
                          <>
                            {a.reviewNote}
                            {a.sellerId && (
                              <Link
                                className="treba-admin-text-link"
                                href={`/admin/sellers/review/${a.sellerId}`}
                              >
                                {t("Відкрити продавця →")}
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
              <Card icon="file" title={t("Профіль продавця")}>
                <div className="treba-admin-detail-list">
                  {[
                    [t("Компанія"), detail.data.companyName],
                    [t("ЄДРПОУ / ІПН"), detail.data.taxNumber],
                    ["Email", detail.data.email],
                    [t("Телефон"), detail.data.phone],
                    [t("Створено"), date(detail.data.createdAt)],
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
                    icon="check"
                    disabled={action.busy}
                    onClick={() =>
                      setDecision({
                        seller: detail.data!,
                        type: detail.data!.status === 1 ? "suspend" : "approve",
                      })
                    }
                  >
                    {detail.data.status === 1
                      ? t("Призупинити")
                      : t("Активувати")}
                  </Button>
                </div>
              </Card>
              {staff.role === "Administrator" && (
                <details className="treba-admin-card treba-admin-category-access">
                  <summary>
                    <span className="treba-admin-heading-icon">
                      <Icon name="layers" size={20} />
                    </span>
                    <strong>{t("Дозволені категорії")}</strong>
                    <span className="treba-admin-category-access-count">
                      {t("Вибрано категорій: {0}", [permittedCategoryCount ?? "—"])}
                    </span>
                    <Icon name="chevron" size={18} />
                  </summary>
                  <div className="treba-admin-category-access-content">
                    <Field label={t("Категорії продавця")}>
                      <select
                        multiple
                        size={8}
                        value={permittedCategoryIds}
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
                    {permittedCategoryIds.map((categoryId) => (
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
                        {t("· включати підкатегорії")}
                      </label>
                    ))}
                    <div className="treba-admin-actions">
                      <Button
                        icon="lock"
                        disabled={
                          action.busy ||
                          (!allowed && !Object.keys(descendants).length)
                        }
                        onClick={() =>
                          void action.run(
                            `telegram/sellers/${id}/categories`,
                            {
                              grants: permittedCategoryIds.map((categoryId) => ({
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
                        {t("Зберегти доступ")}
                      </Button>
                    </div>
                  </div>
                </details>
              )}
            </>
          )
        )
      ) : (
        <Card>
          <Filters>
            <select
              name="status"
              aria-label={t("Статус продавця")}
              defaultValue={params.get("status") ?? ""}
            >
              <option value="">{t("Усі статуси")}</option>
              <option value="0">{t("Очікує")}</option>
              <option value="1">{t("Активний")}</option>
              <option value="2">{t("Призупинено")}</option>
            </select>
          </Filters>
          {list.loading ? (
            <Loading />
          ) : (
            <Table
              rows={visible}
              columns={[
                {
                  title: t("Продавець"),
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
                  title: t("Контакт"),
                  render: (s) => (
                    <>
                      {s.email}
                      <small>{s.phone}</small>
                    </>
                  ),
                },
                {
                  title: t("Статус"),
                  render: (s) => (
                    <Badge
                      value={
                        ["PENDING", "ACTIVE", "SUSPENDED"][s.status] ??
                        String(s.status)
                      }
                    />
                  ),
                },
                { title: t("Дата"), render: (s) => date(s.createdAt) },
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
              ? t("Активувати продавця?")
              : t("Призупинити продавця?")
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
          title={t("Рішення щодо заявки")}
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
          <Field label={t("Рішення")}>
            <select
              value={String(approve)}
              onChange={(e) => setApprove(e.target.value === "true")}
            >
              <option value="true">{t("Схвалити")}</option>
              <option value="false">{t("Відхилити")}</option>
            </select>
          </Field>
          <Field label={t("Адреса магазину")}>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} />
          </Field>
          <Field label={t("Примітка")}>
            <textarea
              value={note}
              maxLength={2000}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
          <p className="treba-admin-note">
            {t("При схваленні продавець отримає доступ до всіх категорій.")}
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
  const { date, language, t } = useAdminI18n();
  const params = useSearchParams(),
    list = useResource<Paged<User>>(!id && !create ? "users?" + params : null),
    detail = useResource<User>(id ? "users/" + id : null),
    action = useAction(detail.reload),
    [confirm, setConfirm] = useState(false);
  const formatBirthDate = (value?: string | null) => {
    if (!value) return "—";
    const parsed = new Date(`${value}T00:00:00Z`);
    if (!Number.isFinite(parsed.getTime())) return value;
    return new Intl.DateTimeFormat(language === "en" ? "en-GB" : "uk-UA", {
      dateStyle: "medium",
      timeZone: "UTC",
    }).format(parsed);
  };
  async function submit(form: FormData) {
    const result = await action.run<User>("users", Object.fromEntries(form));
    if (result) window.location.assign("/admin/users/" + result.id);
  }
  return (
    <>
      <Hero
        title={
          create
            ? t("Новий користувач")
            : detail.data
              ? `${detail.data.firstName} ${detail.data.lastName}`
              : t("Користувачі")
        }
        description={t("Облікові записи та контроль доступу.")}
        action={
          !create && (
            <ActionLink href="/admin/users/create">
              {t("Створити користувача")}
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
                ["firstName", t("Ім’я"), "text"],
                ["lastName", t("Прізвище"), "text"],
                ["middleName", t("По батькові"), "text"],
                ["phone", t("Телефон"), "tel"],
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
              <Button icon="plus" type="submit" disabled={action.busy}>
                {t("Створити")}
              </Button>
            </div>
          </form>
        </Card>
      ) : id ? (
        detail.loading ? (
          <Loading />
        ) : (
          detail.data && (
            <>
              <Card icon="user" title={t("Обліковий запис")}>
                <div className="treba-admin-user-identity">
                  <UserAvatar user={detail.data} size={58} className="treba-admin-user-avatar-large" />
                  <div>
                    <h3>{[detail.data.firstName, detail.data.middleName, detail.data.lastName].filter(Boolean).join(" ")}</h3>
                    <div className="treba-admin-user-identity-meta">
                      {detail.data.role && <span className="treba-admin-user-role">{t(roleLabel(detail.data.role) ?? detail.data.role)}</span>}
                      <Badge value={detail.data.status} />
                    </div>
                  </div>
                </div>
                <div className="treba-admin-detail-list">
                  {[
                    [t("ID користувача"), detail.data.id],
                    ["Email", detail.data.email],
                    [t("Телефон"), detail.data.phone],
                    [t("Дата реєстрації"), date(detail.data.createdAt)],
                    [t("Останній вхід"), date(detail.data.lastLoginAt)],
                    [t("Дата оновлення"), date(detail.data.updatedAt)],
                  ].map(([title, value]) => (
                    <div key={title}>
                      <dt>{title}</dt>
                      <dd>{value || "—"}</dd>
                    </div>
                  ))}
                </div>
                <div className="treba-admin-user-verifications">
                  <span data-verified={detail.data.emailVerified === true}>
                    <Icon name={detail.data.emailVerified ? "check" : "close"} size={15} />
                    {t(detail.data.emailVerified ? "Email підтверджено" : "Email не підтверджено")}
                  </span>
                  <span data-verified={detail.data.phoneVerified === true}>
                    <Icon name={detail.data.phoneVerified ? "check" : detail.data.phone ? "close" : "info"} size={15} />
                    {t(detail.data.phoneVerified ? "Телефон підтверджено" : detail.data.phone ? "Телефон не підтверджено" : "Телефон не вказано")}
                  </span>
                </div>
                <div className="treba-admin-actions">
                  <Button
                    tone="danger"
                    disabled={action.busy}
                    onClick={() => setConfirm(true)}
                  >
                    {detail.data.status === "BLOCKED"
                      ? t("Розблокувати")
                      : t("Заблокувати")}
                  </Button>
                </div>
              </Card>
              <div className="treba-admin-user-detail-grid">
                <Card icon="file" title={t("Профіль користувача")}>
                  {detail.data.profile ? (
                    <div className="treba-admin-detail-list">
                      <div>
                        <dt>{t("Дата народження")}</dt>
                        <dd>{formatBirthDate(detail.data.profile.birthDate)}</dd>
                      </div>
                      <div>
                        <dt>{t("Стать")}</dt>
                        <dd>
                          {detail.data.profile.gender
                            ? t(
                                ({
                                  female: "Жіноча",
                                  male: "Чоловіча",
                                  other: "Інша",
                                } as Record<string, string>)[
                                  detail.data.profile.gender.toLowerCase()
                                ] ?? detail.data.profile.gender,
                              )
                            : t("Не вказано")}
                        </dd>
                      </div>
                      <div>
                        <dt>{t("Мова інтерфейсу")}</dt>
                        <dd>
                          {detail.data.profile.language === "en"
                            ? "English"
                            : detail.data.profile.language === "uk"
                              ? "Українська"
                              : detail.data.profile.language || "—"}
                        </dd>
                      </div>
                      <div>
                        <dt>{t("Маркетингові листи")}</dt>
                        <dd>
                          {detail.data.profile.marketingEmailsEnabled
                            ? t("Так")
                            : t("Ні")}
                        </dd>
                      </div>
                    </div>
                  ) : (
                    <p className="treba-admin-note">
                      {t("Профіль користувача ще не заповнено.")}
                    </p>
                  )}
                </Card>
                <Card
                  icon="truck"
                  title={t("Адреси доставки ({0})", [detail.data.addresses?.length ?? 0])}
                >
                  {detail.data.addresses?.length ? (
                    detail.data.addresses.map((address) => (
                      <article className="treba-admin-user-address" key={address.id}>
                        <header>
                          <strong>{address.recipientName}</strong>
                          {address.defaultAddress && (
                            <span>{t("Основна адреса")}</span>
                          )}
                        </header>
                        <p>
                          {[
                            address.country,
                            address.region,
                            address.city,
                            address.street,
                            address.building && `${t("Будинок")} ${address.building}`,
                            address.apartment && `${t("Квартира")} ${address.apartment}`,
                          ]
                            .filter(Boolean)
                            .join(", ")}
                        </p>
                        <small>
                          {[
                            address.postalCode &&
                              `${t("Поштовий індекс")}: ${address.postalCode}`,
                            address.recipientPhone,
                          ]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </small>
                      </article>
                    ))
                  ) : (
                    <p className="treba-admin-note">
                      {t("Збережених адрес доставки немає.")}
                    </p>
                  )}
                </Card>
              </div>
            </>
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
                      title: t("Ім’я"),
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
                      title: t("Контакти"),
                      render: (u) => (
                        <>
                          {u.email}
                          <small>{u.phone}</small>
                        </>
                      ),
                    },
                    {
                      title: t("Статус"),
                      render: (u) => <Badge value={u.status} />,
                    },
                    { title: t("Дата"), render: (u) => date(u.createdAt) },
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
          title={t("Змінити доступ користувача?")}
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

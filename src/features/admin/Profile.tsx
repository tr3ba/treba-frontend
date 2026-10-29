"use client";
import { useAdminI18n } from "@/features/admin/i18n/provider";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import {
  Alert,
  Button,
  Card,
  Feedback,
  Field,
  Hero,
  Loading,
  useAction,
} from "@/components/admin/ui";
import { useResource } from "./api";
import type { Feed, User } from "./types";
import { normalizeLanguage, type AdminLanguage } from "./i18n/core";
import { resolveMediaUrl } from "@/lib/api/client";
export default function Profile() {
  const { t, language, setLanguage } = useAdminI18n();
  const [preferredLanguage, setPreferredLanguage] =
    useState<AdminLanguage | null>(null);
  const resource = useResource<User>("profile"),
    [edited, setModel] = useState<User | null>(null),
    action = useAction(resource.reload);
  const model = edited ?? resource.data;
  return (
    <>
      <Hero
        title={t("Мій профіль")}
        description={t("Особисті дані та захист облікового запису.")}
      />
      <Alert message={resource.error} />
      <Feedback action={action} />
      {!model ? (
        <Loading />
      ) : (
        <div className="treba-admin-two-grid">
          <Card icon="user" title={t("Особисті дані")}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void action
                  .run<User>(
                    "profile",
                    {
                      email: model.email,
                      firstName: model.firstName,
                      lastName: model.lastName,
                      middleName: model.middleName,
                      phone: model.phone || null,
                      birthDate: model.profile?.birthDate || null,
                      gender: model.profile?.gender || null,
                      language: preferredLanguage ?? language,
                      marketingEmailsEnabled:
                        model.profile?.marketingEmailsEnabled ?? false,
                    },
                    "PATCH",
                  )
                  .then((result) => {
                    if (result) {
                      setModel(null);
                      setPreferredLanguage(null);
                      setLanguage(normalizeLanguage(result.profile?.language));
                    }
                  });
              }}
            >
              <div className="treba-admin-form-grid">
                {(
                  [
                    ["firstName", t("Ім’я"), "text"],
                    ["lastName", t("Прізвище"), "text"],
                    ["middleName", t("По батькові"), "text"],
                    ["email", "Email", "email"],
                    ["phone", t("Телефон"), "tel"],
                  ] as const
                ).map(([key, title, type]) => (
                  <Field key={key} label={title}>
                    <input
                      type={type}
                      required={["firstName", "lastName", "email"].includes(
                        key,
                      )}
                      value={model[key] ?? ""}
                      onChange={(e) =>
                        setModel({ ...model, [key]: e.target.value })
                      }
                    />
                  </Field>
                ))}
                <Field label={t("Дата народження")}>
                  <input
                    type="date"
                    value={model.profile?.birthDate ?? ""}
                    onChange={(e) =>
                      setModel({
                        ...model,
                        profile: {
                          ...model.profile,
                          birthDate: e.target.value,
                        },
                      })
                    }
                  />
                </Field>
                <Field label={t("Мова інтерфейсу")}>
                  <select
                    value={preferredLanguage ?? language}
                    onChange={(e) =>
                      setPreferredLanguage(normalizeLanguage(e.target.value))
                    }
                  >
                    <option value="uk">Українська</option>
                    <option value="en">English</option>
                  </select>
                </Field>
                <Field label={t("Стать")}>
                  <select
                    value={model.profile?.gender ?? ""}
                    onChange={(e) =>
                      setModel({
                        ...model,
                        profile: { ...model.profile, gender: e.target.value },
                      })
                    }
                  >
                    <option value="">{t("Не вказано")}</option>
                    <option value="female">{t("Жіноча")}</option>
                    <option value="male">{t("Чоловіча")}</option>
                    <option value="other">{t("Інша")}</option>
                  </select>
                </Field>
              </div>
              <div className="treba-admin-actions">
                <Button type="submit" disabled={action.busy} icon="check">
                  {t("Зберегти профіль")}
                </Button>
              </div>
            </form>
          </Card>
          <Card icon="image" title={t("Фото профілю")}>
            {resource.data?.profile?.avatarUrl && (
              <Image
                unoptimized
                width={80}
                height={80}
                className="treba-admin-profile-photo"
                src={
                  resolveMediaUrl(resource.data?.profile?.avatarUrl) ??
                  "/icons/box.svg"
                }
                alt={t("Фото профілю")}
              />
            )}
            <Field label={t("Оберіть фото (до 5 МБ)")}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) {
                    action.setError(t("Максимальний розмір фото — 5 МБ."));
                    return;
                  }
                  const form = new FormData();
                  form.append("avatar", file);
                  void action.run("profile/avatar", form);
                }}
              />
            </Field>
            {resource.data?.profile?.avatarUrl && (
              <div className="treba-admin-actions">
                <Button
                  icon="trash"
                  tone="danger"
                  onClick={() =>
                    void action.run("profile/avatar", undefined, "DELETE")
                  }
                >
                  {t("Видалити фото")}
                </Button>
              </div>
            )}
          </Card>
        </div>
      )}
      <div className="treba-admin-two-grid">
        <Security />
        <TelegramLink />
      </div>
    </>
  );
}
function Security() {
  const { t } = useAdminI18n();
  const resource = useResource<{
      authenticatorEnabled: boolean;
      emailTwoFactorEnabled: boolean;
      emailVerified: boolean;
      maskedEmail: string;
    }>("security"),
    action = useAction(resource.reload);
  const [setup, setSetup] = useState<{
      manualKey: string;
      qrCodeDataUrl: string;
    } | null>(null),
    [emailChallenge, setEmailChallenge] = useState<{
      challengeId: string;
      maskedEmail: string;
    } | null>(null),
    [code, setCode] = useState(""),
    [mode, setMode] = useState("");
  return (
    <Card icon="file" title={t("Захист облікового запису")}>
      <Alert message={resource.error} />
      <Feedback action={action} />
      <p className="treba-admin-note">
        Google Authenticator:{" "}
        {resource.data?.authenticatorEnabled ? t("увімкнено") : t("вимкнено")}
        <br />
        {t("Підтвердження поштою:")}{" "}
        {resource.data?.emailTwoFactorEnabled ? t("увімкнено") : t("вимкнено")}
      </p>
      <div className="treba-admin-actions">
        <Button
          icon="lock"
          tone="secondary"
          disabled={action.busy}
          onClick={() => {
            setCode("");
            setEmailChallenge(null);
            if (resource.data?.authenticatorEnabled) {
              setSetup(null);
              setMode("authenticator/disable");
            } else
              void action
                .run<typeof setup>("security/authenticator/setup", {})
                .then((result) => {
                  if (result) {
                    setSetup(result);
                    setMode("authenticator/confirm");
                  }
                });
          }}
        >
          {resource.data?.authenticatorEnabled
            ? t("Вимкнути Authenticator")
            : t("Підключити Authenticator")}
        </Button>
        <Button
          icon="mail"
          tone="secondary"
          disabled={action.busy}
          onClick={() => {
            setCode("");
            setSetup(null);
            const disabling = resource.data?.emailTwoFactorEnabled;
            void action
              .run<typeof emailChallenge>(
                `security/email/${disabling ? "disable/start" : "setup"}`,
                {},
              )
              .then((result) => {
                if (result) {
                  setEmailChallenge(result);
                  setMode(
                    disabling ? "email/disable/confirm" : "email/confirm",
                  );
                }
              });
          }}
        >
          {resource.data?.emailTwoFactorEnabled
            ? t("Вимкнути пошту")
            : t("Підключити пошту")}
        </Button>
      </div>
      {setup && (
        <>
          <Image
            unoptimized
            src={setup.qrCodeDataUrl}
            alt={t("QR-код для Authenticator")}
            width={180}
            height={180}
          />
          <p className="treba-admin-note">
            {t("Ключ: ")}
            {setup.manualKey}
          </p>
        </>
      )}
      {emailChallenge && (
        <p className="treba-admin-note">
          {t("Код надіслано на ")}
          {emailChallenge.maskedEmail}.
        </p>
      )}
      {mode && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void action
              .run("security/" + mode, {
                code,
                ...(emailChallenge
                  ? { challengeId: emailChallenge.challengeId }
                  : {}),
              })
              .then((result) => {
                if (result === undefined) return;
                setCode("");
                setSetup(null);
                setEmailChallenge(null);
                setMode("");
              });
          }}
        >
          <Field label={t("Код підтвердження")}>
            <input
              inputMode="numeric"
              pattern="[0-9]{6}"
              autoComplete="one-time-code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
            />
          </Field>
          <div className="treba-admin-actions">
            <Button icon="check" type="submit" disabled={action.busy}>
              {t("Підтвердити")}
            </Button>
            <Button
              icon="close"
              tone="secondary"
              onClick={() => {
                setMode("");
                setSetup(null);
                setEmailChallenge(null);
              }}
            >
              {t("Скасувати")}
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
function TelegramLink() {
  const { t } = useAdminI18n();
  const resource = useResource<{
      configured: boolean;
      linked: boolean;
      username?: string;
      pendingId?: string;
      pendingTelegramName?: string;
    }>("telegram-account/link", 5000),
    action = useAction(resource.reload),
    [start, setStart] = useState<{
      botUrl: string;
      expiresAt: string;
    } | null>(null);
  return (
    <Card icon="chat" title="Telegram Guard">
      <Alert message={resource.error} />
      <Feedback action={action} />
      <p className="treba-admin-note">
        {resource.data?.linked
          ? t("Підключено: {0}", [resource.data.username ?? "Telegram"])
          : t(
              "Підключіть Telegram для підтвердження входу та робочих сповіщень.",
            )}
      </p>
      {resource.data?.configured ? (
        <div className="treba-admin-actions">
          {resource.data.linked ? (
            <Button
              icon="chat"
              tone="danger"
              disabled={action.busy}
              onClick={() =>
                void action.run("telegram-account/link", undefined, "DELETE")
              }
            >
              {t("Від’єднати Telegram")}
            </Button>
          ) : (
            <Button
              icon="chat"
              tone="secondary"
              disabled={action.busy}
              onClick={() =>
                void action
                  .run<typeof start>("telegram-account/link", {})
                  .then((result) => {
                    if (result) setStart(result);
                  })
              }
            >
              {t("Підключити Telegram")}
            </Button>
          )}
          {start && (
            <a
              className="treba-admin-button primary"
              href={start.botUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("Відкрити бота")}
            </a>
          )}
          {resource.data.pendingId && (
            <Button
              icon="chat"
              disabled={action.busy}
              onClick={() =>
                void action.run("telegram-account/link/confirm", {
                  challengeId: resource.data!.pendingId,
                })
              }
            >
              {t("Підтвердити ")}
              {resource.data.pendingTelegramName}
            </Button>
          )}
        </div>
      ) : (
        <p className="treba-admin-note">
          {t("Інтеграція Telegram не налаштована на сервері.")}
        </p>
      )}
    </Card>
  );
}
export function Notifications() {
  const { date, t } = useAdminI18n();
  const resource = useResource<Feed>("notifications", 30000),
    action = useAction(resource.reload);
  return (
    <>
      <Hero
        title={t("Сповіщення")}
        description={t("Нові події та робочі завдання.")}
        action={
          <Button
            icon="check"
            tone="secondary"
            disabled={action.busy || !resource.data?.unreadCount}
            onClick={() =>
              void action.run("notifications/read", {
                keys:
                  resource.data?.items
                    .filter((i) => !i.read)
                    .map((i) => i.key) ?? [],
              })
            }
          >
            {t("Прочитати всі")}
          </Button>
        }
      />
      <Alert message={resource.error} />
      <Feedback action={action} />
      <Card>
        {resource.loading ? (
          <Loading />
        ) : (
          resource.data?.items.map((n) => (
            <article className="treba-admin-notification-card" key={n.key}>
              <div>
                <h3>
                  {!n.read && "• "}
                  {t(n.title)}
                </h3>
                <p>{n.text}</p>
                <small>{date(n.createdAt)}</small>
              </div>
              <Link
                className="treba-admin-text-link"
                href={
                  n.scope === "admin"
                    ? "/admin" + (n.path === "/" ? "" : n.path)
                    : n.path.startsWith("/admin")
                      ? n.path
                      : "/admin"
                }
                onClick={() => {
                  if (!n.read)
                    void action.run("notifications/read", { keys: [n.key] });
                }}
              >
                {t("Відкрити →")}
              </Link>
            </article>
          ))
        )}
        {resource.data?.items.length === 0 && (
          <p className="treba-admin-note">{t("Нових сповіщень немає.")}</p>
        )}
      </Card>
    </>
  );
}

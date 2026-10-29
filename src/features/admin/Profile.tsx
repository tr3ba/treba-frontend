"use client";
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
import { date } from "./api";
import { resolveMediaUrl } from "@/lib/api/client";
export default function Profile() {
  const resource = useResource<User>("profile"),
    [edited, setModel] = useState<User | null>(null),
    action = useAction(resource.reload);
  const model = edited ?? resource.data;
  return (
    <>
      <Hero
        title="Мій профіль"
        description="Особисті дані та захист облікового запису."
      />
      <Alert message={resource.error} />
      <Feedback action={action} />
      {!model ? (
        <Loading />
      ) : (
        <div className="treba-admin-two-grid">
          <Card title="Особисті дані">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void action.run(
                  "profile",
                  {
                    email: model.email,
                    firstName: model.firstName,
                    lastName: model.lastName,
                    middleName: model.middleName,
                    phone: model.phone || null,
                    birthDate: model.profile?.birthDate || null,
                    gender: model.profile?.gender || null,
                    language: model.profile?.language ?? "uk",
                    marketingEmailsEnabled:
                      model.profile?.marketingEmailsEnabled ?? false,
                  },
                  "PATCH",
                );
              }}
            >
              <div className="treba-admin-form-grid">
                {(
                  [
                    ["firstName", "Ім’я", "text"],
                    ["lastName", "Прізвище", "text"],
                    ["middleName", "По батькові", "text"],
                    ["email", "Email", "email"],
                    ["phone", "Телефон", "tel"],
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
                <Field label="Дата народження">
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
                <Field label="Стать">
                  <select
                    value={model.profile?.gender ?? ""}
                    onChange={(e) =>
                      setModel({
                        ...model,
                        profile: { ...model.profile, gender: e.target.value },
                      })
                    }
                  >
                    <option value="">Не вказано</option>
                    <option value="female">Жіноча</option>
                    <option value="male">Чоловіча</option>
                    <option value="other">Інша</option>
                  </select>
                </Field>
              </div>
              <div className="treba-admin-actions">
                <Button type="submit" disabled={action.busy} icon="check">
                  Зберегти профіль
                </Button>
              </div>
            </form>
          </Card>
          <Card title="Фото профілю">
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
                alt="Фото профілю"
              />
            )}
            <Field label="Оберіть фото (до 5 МБ)">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) {
                    action.setError("Максимальний розмір фото — 5 МБ.");
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
                  tone="danger"
                  onClick={() =>
                    void action.run("profile/avatar", undefined, "DELETE")
                  }
                >
                  Видалити фото
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
    <Card title="Захист облікового запису">
      <Alert message={resource.error} />
      <Feedback action={action} />
      <p className="treba-admin-note">
        Google Authenticator:{" "}
        {resource.data?.authenticatorEnabled ? "увімкнено" : "вимкнено"}
        <br />
        Підтвердження поштою:{" "}
        {resource.data?.emailTwoFactorEnabled ? "увімкнено" : "вимкнено"}
      </p>
      <div className="treba-admin-actions">
        <Button
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
            ? "Вимкнути Authenticator"
            : "Підключити Authenticator"}
        </Button>
        <Button
          tone="secondary"
          disabled={action.busy}
          onClick={() => {
            setCode("");
            setSetup(null);
            const disabling = resource.data?.emailTwoFactorEnabled;
            void action
              .run<
                typeof emailChallenge
              >(`security/email/${disabling ? "disable/start" : "setup"}`, {})
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
            ? "Вимкнути пошту"
            : "Підключити пошту"}
        </Button>
      </div>
      {setup && (
        <>
          <Image
            unoptimized
            src={setup.qrCodeDataUrl}
            alt="QR-код для Authenticator"
            width={180}
            height={180}
          />
          <p className="treba-admin-note">Ключ: {setup.manualKey}</p>
        </>
      )}
      {emailChallenge && (
        <p className="treba-admin-note">
          Код надіслано на {emailChallenge.maskedEmail}.
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
          <Field label="Код підтвердження">
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
            <Button type="submit" disabled={action.busy}>
              Підтвердити
            </Button>
            <Button
              tone="secondary"
              onClick={() => {
                setMode("");
                setSetup(null);
                setEmailChallenge(null);
              }}
            >
              Скасувати
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
function TelegramLink() {
  const resource = useResource<{
      configured: boolean;
      linked: boolean;
      username?: string;
      pendingId?: string;
      pendingTelegramName?: string;
    }>("telegram-account/link", 5000),
    action = useAction(resource.reload),
    [start, setStart] = useState<{ botUrl: string; expiresAt: string } | null>(
      null,
    );
  return (
    <Card title="Telegram Guard">
      <Alert message={resource.error} />
      <Feedback action={action} />
      <p className="treba-admin-note">
        {resource.data?.linked
          ? `Підключено: ${resource.data.username ?? "Telegram"}`
          : "Підключіть Telegram для підтвердження входу та робочих сповіщень."}
      </p>
      {resource.data?.configured ? (
        <div className="treba-admin-actions">
          {resource.data.linked ? (
            <Button
              tone="danger"
              disabled={action.busy}
              onClick={() =>
                void action.run("telegram-account/link", undefined, "DELETE")
              }
            >
              Від’єднати Telegram
            </Button>
          ) : (
            <Button
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
              Підключити Telegram
            </Button>
          )}
          {start && (
            <a
              className="treba-admin-button primary"
              href={start.botUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Відкрити бота
            </a>
          )}
          {resource.data.pendingId && (
            <Button
              disabled={action.busy}
              onClick={() =>
                void action.run("telegram-account/link/confirm", {
                  challengeId: resource.data!.pendingId,
                })
              }
            >
              Підтвердити {resource.data.pendingTelegramName}
            </Button>
          )}
        </div>
      ) : (
        <p className="treba-admin-note">
          Інтеграція Telegram не налаштована на сервері.
        </p>
      )}
    </Card>
  );
}
export function Notifications() {
  const resource = useResource<Feed>("notifications", 30000),
    action = useAction(resource.reload);
  return (
    <>
      <Hero
        title="Сповіщення"
        description="Нові події та робочі завдання."
        action={
          <Button
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
            Прочитати всі
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
                  {n.title}
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
                Відкрити →
              </Link>
            </article>
          ))
        )}
        {resource.data?.items.length === 0 && (
          <p className="treba-admin-note">Нових сповіщень немає.</p>
        )}
      </Card>
    </>
  );
}

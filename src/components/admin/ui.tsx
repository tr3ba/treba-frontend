"use client";
import { useAdminI18n } from "@/features/admin/i18n/provider";
import { message } from "@/features/admin/i18n/core";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Icon from "./Icon";
import type { Paged } from "@/features/admin/types";
import { adminRequest } from "@/features/admin/api";
function sectionIcon(path: string) {
  const section = path.split("/")[2];
  return (
    (
      {
        products: "box",
        orders: "bag",
        moderation: "shield",
        categories: "layers",
        sellers: "shop",
        reviews: "star",
        support: "chat",
        "customer-activity": "chart",
        loyalty: "gift",
        users: "users",
        settings: "settings",
        profile: "user",
        notifications: "bell",
      } as Record<string, string>
    )[section] ?? "grid"
  );
}
export function Badge({ value }: { value: string | number }) {
  const { label } = useAdminI18n();
  const text = String(value);
  const state = text.toUpperCase();
  const tone = /REJECT|CANCEL|BLOCK|FAIL|SUSPEND/.test(state)
    ? "red"
    : /ACTIVE|ENABLED|PAID|PUBLISHED|APPROVED|COMPLETED|DELIVERED|READY/.test(state)
      ? "green"
      : /PENDING|AWAIT|OPEN|QUEUE|PROGRESS|SCHEDULE/.test(state)
        ? "orange"
        : "gray";
  return (
    <span className={`treba-admin-badge ${tone}`}>
      <i />
      {label(text)}
    </span>
  );
}
export function Hero({
  title,
  description,
  action,
  eyebrow,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  eyebrow?: string;
}) {
  const { t } = useAdminI18n();
  const icon = sectionIcon(usePathname());
  return (
    <header className="treba-admin-hero">
      <div className="treba-admin-hero-copy">
        <span className="treba-admin-section-icon">
          <Icon name={icon} size={25} />
        </span>
        <div>
          {eyebrow && <div className="treba-admin-eyebrow">{t(eyebrow)}</div>}
          <h1>{title}</h1>
          {description && <p>{description}</p>}
        </div>
      </div>
      {action}
    </header>
  );
}
export function Card({
  children,
  title,
  className = "",
  icon = "file",
}: {
  children: ReactNode;
  title?: string;
  className?: string;
  icon?: string;
}) {
  return (
    <section className={`treba-admin-card ${className}`}>
      {title && (
        <h2>
          <span className="treba-admin-heading-icon">
            <Icon name={icon} size={20} />
          </span>
          {title}
        </h2>
      )}
      {children}
    </section>
  );
}
export function Alert({ message }: { message?: string }) {
  const { error, language, t } = useAdminI18n();
  const translated = error(message ?? "");
  const showOriginal =
    language === "en" &&
    translated !== message &&
    /[\u0400-\u04ff]/.test(message ?? "") &&
    translated === t("Не вдалося виконати запит.");
  return message ? (
    <div className="treba-admin-alert" role="alert">
      <Icon name="alert" />
      <div>
        {translated}
        {showOriginal && (
          <details>
            <summary>{t("Повідомлення сервера")}</summary>
            {message}
          </details>
        )}
      </div>
    </div>
  ) : null;
}
export function Loading() {
  const { t } = useAdminI18n();
  return (
    <div
      className="treba-admin-skeleton"
      role="status"
      aria-label={t("Завантаження")}
    >
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}
export function Empty({
  title = message("Тут поки порожньо"),
  description = message("Спробуйте змінити фільтри або поверніться пізніше."),
}: {
  title?: string;
  description?: string;
}) {
  const { t } = useAdminI18n();
  return (
    <div className="treba-admin-empty">
      <span>
        <Icon name="box" size={32} />
      </span>
      <h3>{t(title)}</h3>
      <p>{t(description)}</p>
    </div>
  );
}
export function Field({
  label,
  children,
  wide = false,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={`treba-admin-field${wide ? " wide" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}
export function Button({
  children,
  onClick,
  icon,
  tone = "primary",
  disabled = false,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  icon?: string;
  tone?: string;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const actionIcon = icon ?? (type === "submit" ? "save" : undefined);
  return (
    <button
      type={type}
      className={`treba-admin-button ${tone}`}
      disabled={disabled}
      onClick={onClick}
    >
      {actionIcon && <Icon name={actionIcon} size={18} />}
      {children}
    </button>
  );
}
export function ActionLink({
  href,
  children,
  icon = "plus",
}: {
  href: string;
  children: ReactNode;
  icon?: string;
}) {
  return (
    <Link className="treba-admin-button primary" href={href}>
      <Icon name={icon} size={18} />
      {children}
    </Link>
  );
}
export function Table<T>({
  rows,
  columns,
}: {
  rows: T[];
  columns: {
    title: string;
    render: (row: T) => ReactNode;
  }[];
}) {
  if (!rows.length) return <Empty />;
  return (
    <div className="treba-admin-table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.title}>{c.title}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr
              key={
                (
                  row as {
                    id?: string;
                  }
                ).id ?? index
              }
            >
              {columns.map((c) => (
                <td key={c.title}>{c.render(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function Filters({
  statuses,
  children,
  search = true,
}: {
  statuses?: string[];
  children?: ReactNode;
  search?: boolean;
}) {
  const { label, t } = useAdminI18n();
  const params = useSearchParams(),
    router = useRouter(),
    path = usePathname();
  function submit(form: FormData) {
    const next = new URLSearchParams(params);
    for (const [key, value] of form) {
      if (value) next.set(key, String(value));
      else next.delete(key);
    }
    next.delete("page");
    router.push(path + "?" + next);
  }
  return (
    <form
      key={params.toString()}
      className="treba-admin-filters"
      action={submit}
    >
      {search && (
        <div className="treba-admin-search">
          <Icon name="search" />
          <input
            aria-label={t("Пошук")}
            name="search"
            placeholder={t("Пошук…")}
            defaultValue={params.get("search") ?? ""}
          />
        </div>
      )}
      {statuses && (
        <select
          aria-label={t("Статус")}
          name="status"
          defaultValue={params.get("status") ?? ""}
        >
          <option value="">{t("Усі статуси")}</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>
      )}
      {children}
      <Button type="submit" tone="secondary" icon="search">
        {t("Застосувати")}
      </Button>
      {params.size > 0 && (
        <Link className="treba-admin-text-link" href={path}>
          {t("Скинути")}
        </Link>
      )}
    </form>
  );
}
export function Pagination({
  data,
}: {
  data: Pick<Paged<unknown>, "page" | "totalPages" | "totalElements">;
}) {
  const { t } = useAdminI18n();
  const params = useSearchParams(),
    path = usePathname();
  const url = (page: number) => {
    const p = new URLSearchParams(params);
    p.set("page", String(page));
    return path + "?" + p;
  };
  return (
    <nav className="treba-admin-pagination" aria-label={t("Сторінки")}>
      <span>
        {t("Усього: ")}
        <b>{data.totalElements}</b>
      </span>
      <div>
        {data.page > 1 && (
          <Link
            className="treba-admin-button secondary"
            href={url(data.page - 1)}
          >
            {t("← Назад")}
          </Link>
        )}
        <span>
          {data.page} / {Math.max(1, data.totalPages)}
        </span>
        {data.page < data.totalPages && (
          <Link
            className="treba-admin-button secondary"
            href={url(data.page + 1)}
          >
            {t("Далі →")}
          </Link>
        )}
      </div>
    </nav>
  );
}
export function useAction(reload?: () => Promise<void>) {
  const { t } = useAdminI18n();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  async function run<T>(
    path: string,
    body?: unknown,
    method = "POST",
  ): Promise<T | undefined> {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const result = await adminRequest<T>(path, { method, body });
      await reload?.();
      setSuccess(t("Зміни збережено"));
      return result === undefined ? (null as T) : result;
    } catch (e) {
      setError(e instanceof Error ? e.message : t("Помилка запиту"));
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, success, run, setError, setSuccess };
}
export function Feedback({
  action,
}: {
  action: {
    error: string;
    success: string;
  };
}) {
  const { t } = useAdminI18n();
  return (
    <>
      <Alert message={action.error} />
      {action.success && (
        <div className="treba-admin-success" role="status">
          <Icon name="check" />
          {t(action.success)}
        </div>
      )}
    </>
  );
}
export function Confirm({
  title,
  children,
  onConfirm,
  onClose,
  busy,
  error,
  confirmLabel,
  confirmIcon = "check",
  confirmDisabled = false,
  className = "",
}: {
  title: string;
  children: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
  busy?: boolean;
  error?: string;
  confirmLabel?: string;
  confirmIcon?: string;
  confirmDisabled?: boolean;
  className?: string;
}) {
  const { t } = useAdminI18n();
  const dialog = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const first = dialog.current?.querySelector<HTMLElement>(
      'button:not([disabled]):not([hidden]),input:not([disabled]):not([hidden]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex="0"]',
    );
    (first ?? dialog.current)?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="treba-admin-overlay"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <section
        ref={dialog}
        className={`treba-admin-dialog ${className}`}
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape" && !busy) {
            e.preventDefault();
            onClose();
          }
          if (e.key !== "Tab") return;
          const fields = Array.from(
            dialog.current?.querySelectorAll<HTMLElement>(
              'button:not([disabled]):not([hidden]),input:not([disabled]):not([hidden]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex="0"]',
            ) ?? [],
          );
          const first = fields[0],
            last = fields.at(-1);
          if (!fields.length) { e.preventDefault(); return; }
          const hasFieldFocus = fields.some(field => field === document.activeElement);
          if (e.shiftKey && (document.activeElement === first || !hasFieldFocus)) {
            e.preventDefault();
            last?.focus();
          }
          if (!e.shiftKey && (document.activeElement === last || !hasFieldFocus)) {
            e.preventDefault();
            first?.focus();
          }
        }}
      >
        <h2>{title}</h2>
        <Alert message={error} />
        <div className="treba-admin-dialog-content">{children}</div>
        <div className="treba-admin-actions">
          <Button
            tone="secondary"
            icon="close"
            onClick={onClose}
            disabled={busy}
          >
            {t("Скасувати")}
          </Button>
          <Button icon={confirmIcon} onClick={onConfirm} disabled={busy || confirmDisabled}>
            {confirmLabel ?? t("Підтвердити")}
          </Button>
        </div>
      </section>
    </div>
  );
}

"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Icon from "./Icon";
import type { Paged } from "@/features/admin/types";
import { adminRequest } from "@/features/admin/api";

const labels: Record<string, string> = {
  ACTIVE: "Активний",
  PENDING_MODERATION: "На модерації",
  PENDING: "На перевірці",
  DRAFT: "Чернетка",
  REJECTED: "Відхилено",
  PUBLISHED: "Опубліковано",
  APPROVED: "Схвалено",
  SUSPENDED: "Призупинено",
  BLOCKED: "Заблоковано",
  OPEN: "Відкрито",
  IN_PROGRESS: "В роботі",
  CLOSED: "Закрито",
  AWAITING_PAYMENT: "Очікує оплати",
  CREATED: "Створено",
  PAID: "Оплачено",
  CONFIRMED: "Підтверджено",
  PROCESSING: "Обробляється",
  READY_FOR_SHIPMENT: "Готове до відправлення",
  SHIPPED: "Відправлено",
  DELIVERED: "Доставлено",
  COMPLETED: "Завершено",
  CANCELLED: "Скасовано",
  RETURN_REQUESTED: "Запит повернення",
  RETURNED: "Повернуто",
  SCHEDULED: "Заплановано",
  FINISHED: "Завершено",
  CHAT: "Чат",
  QUESTION: "Питання",
  RETURN: "Повернення",
  QUEUED: "У черзі",
  FAILED: "Помилка",
  READY: "Готово",
  RUNNING: "Обробляється",
};
export const label = (value: string) => labels[value.toUpperCase()] ?? value;
export function Badge({ value }: { value: string | number }) {
  const text = String(value);
  const state = text.toUpperCase();
  const tone = /REJECT|CANCEL|BLOCK|FAIL|SUSPEND/.test(state)
    ? "red"
    : /ACTIVE|PAID|PUBLISHED|APPROVED|COMPLETED|DELIVERED|READY/.test(state)
      ? "green"
      : /PENDING|AWAIT|OPEN|QUEUE|PROGRESS|SCHEDULE/.test(state)
        ? "orange"
        : "gray";
  return (
    <span className={`ad-badge ${tone}`}>
      <i />
      {label(text)}
    </span>
  );
}
export function Hero({
  title,
  description,
  action,
  eyebrow = "РОБОЧИЙ ПРОСТІР",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="ad-hero">
      <div>
        <div className="ad-eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </header>
  );
}
export function Card({
  children,
  title,
  className = "",
}: {
  children: ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <section className={`ad-card ${className}`}>
      {title && <h2>{title}</h2>}
      {children}
    </section>
  );
}
export function Alert({ message }: { message?: string }) {
  return message ? (
    <div className="ad-alert" role="alert">
      <Icon name="shield" />
      {message}
    </div>
  ) : null;
}
export function Loading() {
  return (
    <div className="ad-skeleton" role="status" aria-label="Завантаження">
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}
export function Empty({
  title = "Тут поки порожньо",
  description = "Спробуйте змінити фільтри або поверніться пізніше.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="ad-empty">
      <span>
        <Icon name="box" size={32} />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
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
    <label className={`ad-field${wide ? " wide" : ""}`}>
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
  return (
    <button
      type={type}
      className={`ad-button ${tone}`}
      disabled={disabled}
      onClick={onClick}
    >
      {icon && <Icon name={icon} size={18} />}
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
    <Link className="ad-button primary" href={href}>
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
  columns: { title: string; render: (row: T) => ReactNode }[];
}) {
  if (!rows.length) return <Empty />;
  return (
    <div className="ad-table-wrap">
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
            <tr key={(row as { id?: string }).id ?? index}>
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
    <form key={params.toString()} className="ad-filters" action={submit}>
      {search && (
        <div className="ad-search">
          <Icon name="search" />
          <input
            aria-label="Пошук"
            name="search"
            placeholder="Пошук…"
            defaultValue={params.get("search") ?? ""}
          />
        </div>
      )}
      {statuses && (
        <select
          aria-label="Статус"
          name="status"
          defaultValue={params.get("status") ?? ""}
        >
          <option value="">Усі статуси</option>
          {statuses.map((s) => (
            <option key={s} value={s}>
              {label(s)}
            </option>
          ))}
        </select>
      )}
      {children}
      <Button type="submit" tone="secondary" icon="search">
        Застосувати
      </Button>
      {params.size > 0 && (
        <Link className="ad-text-link" href={path}>
          Скинути
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
  const params = useSearchParams(),
    path = usePathname();
  const url = (page: number) => {
    const p = new URLSearchParams(params);
    p.set("page", String(page));
    return path + "?" + p;
  };
  return (
    <nav className="ad-pagination" aria-label="Сторінки">
      <span>
        Усього: <b>{data.totalElements}</b>
      </span>
      <div>
        {data.page > 1 && (
          <Link className="ad-button secondary" href={url(data.page - 1)}>
            ← Назад
          </Link>
        )}
        <span>
          {data.page} / {Math.max(1, data.totalPages)}
        </span>
        {data.page < data.totalPages && (
          <Link className="ad-button secondary" href={url(data.page + 1)}>
            Далі →
          </Link>
        )}
      </div>
    </nav>
  );
}
export function useAction(reload?: () => Promise<void>) {
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
      setSuccess("Зміни збережено");
      return result === undefined ? (null as T) : result;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Помилка запиту");
    } finally {
      setBusy(false);
    }
  }
  return { busy, error, success, run, setError, setSuccess };
}
export function Feedback({
  action,
}: {
  action: { error: string; success: string };
}) {
  return (
    <>
      <Alert message={action.error} />
      {action.success && (
        <div className="ad-success" role="status">
          <Icon name="check" />
          {action.success}
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
}: {
  title: string;
  children: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
  busy?: boolean;
  error?: string;
}) {
  const dialog = useRef<HTMLElement>(null);
  useEffect(() => {
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const first = dialog.current?.querySelector<HTMLElement>(
      "button:not([disabled]),input,select,textarea,a[href]",
    );
    first?.focus();
    return () => previous?.focus();
  }, []);
  return (
    <div
      className="ad-overlay"
      onClick={() => {
        if (!busy) onClose();
      }}
    >
      <section
        ref={dialog}
        className="ad-dialog"
        role="dialog"
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
              "button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href]",
            ) ?? [],
          );
          const first = fields[0],
            last = fields.at(-1);
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
          if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }}
      >
        <h2>{title}</h2>
        <Alert message={error} />
        <div>{children}</div>
        <div className="ad-actions">
          <Button tone="secondary" onClick={onClose} disabled={busy}>
            Скасувати
          </Button>
          <Button onClick={onConfirm} disabled={busy}>
            Підтвердити
          </Button>
        </div>
      </section>
    </div>
  );
}

"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useState, type ReactNode } from "react";
import { adminRequest, useResource } from "@/features/admin/api";
import { canAccessAdmin } from "@/lib/admin-access";
import { roleLabel, workspaceLabel } from "@/lib/admin";
import type { Feed, User } from "@/features/admin/types";
import Icon from "./Icon";
import { Alert, Button, Empty, Loading } from "./ui";

const StaffContext = createContext<User | null>(null);
export function useStaff() {
  const user = useContext(StaffContext);
  if (!user) throw new Error("Staff session required");
  return user;
}
const nav = [
  ["Робота", "Огляд", "", "grid"],
  ["Робота", "Замовлення", "/orders", "bag"],
  ["Робота", "Товари", "/products", "box"],
  ["Робота", "Модерація", "/moderation", "shield"],
  ["Робота", "Категорії", "/categories", "layers"],
  ["Люди", "Продавці", "/sellers", "shop"],
  ["Люди", "Заявки продавців", "/sellers/applications", "users"],
  ["Люди", "Відгуки", "/reviews", "star"],
  ["Люди", "Підтримка", "/support", "chat"],
  ["Люди", "Покупці", "/customer-activity", "chart"],
  ["Просування", "Акції та промокоди", "/loyalty", "gift"],
  ["Система", "Користувачі", "/users", "users"],
  ["Система", "Налаштування", "/settings", "settings"],
];
export default function AdminShell({ children }: { children: ReactNode }) {
  const session = useResource<{ user: User }>("session", 60000),
    path = usePathname();
  const [open, setOpen] = useState(false),
    [leaving, setLeaving] = useState(false);
  const user = session.data?.user;
  const feed = useResource<Feed>(user ? "notifications" : null, 30000);
  async function logout(store = false) {
    setLeaving(true);
    try {
      await adminRequest("logout", { method: "POST" });
      window.location.assign(store ? "/" : "/login");
    } catch {
      setLeaving(false);
    }
  }
  if (session.loading)
    return (
      <div className="treba-admin-boot" data-treba-workspace="loading">
        <div className="treba-admin-brand-mark">
          T<span>•</span>
        </div>
        <Loading />
      </div>
    );
  if (!user)
    return (
      <div className="treba-admin-boot" data-treba-workspace="sign-in">
        <div className="treba-admin-brand-mark">
          T<span>•</span>
        </div>
        <h1>Робочий простір TREBA</h1>
        <Alert message={session.error} />
        <p>Увійдіть як співробітник або продавець.</p>
        <Link
          className="treba-admin-button primary"
          href={"/login?next=" + encodeURIComponent(path)}
        >
          Увійти
        </Link>
        <Button tone="secondary" onClick={() => void session.reload()}>
          Спробувати ще раз
        </Button>
        <Link href="/">На головну</Link>
      </div>
    );
  const active =
    nav.find((n) => n[2] && path.startsWith("/admin" + n[2])) ?? nav[0];
  return (
    <StaffContext.Provider value={user}>
      <div className="treba-admin-shell" data-treba-workspace="ready">
        {open && (
          <button
            className="treba-admin-nav-scrim"
            aria-label="Закрити меню"
            onClick={() => setOpen(false)}
          />
        )}
        <aside className={`treba-admin-sidebar ${open ? "is-open" : ""}`}>
          <Link
            href="/admin"
            className="treba-admin-brand"
            onClick={() => setOpen(false)}
          >
            <div className="treba-admin-brand-mark">
              T<span>•</span>
            </div>
            <div>
              <b>TREBA</b>
              <small>{workspaceLabel(user.role)}</small>
            </div>
          </Link>
          <div className="treba-admin-nav-scroll">
            <nav>
              {nav
                .filter((n) => canAccessAdmin(user.role, "/admin" + n[2]))
                .map((item, index, visible) => (
                  <div key={item[2]}>
                    {(index === 0 || visible[index - 1][0] !== item[0]) && (
                      <div className="treba-admin-nav-label">{item[0]}</div>
                    )}
                    <Link
                      href={"/admin" + item[2]}
                      onClick={() => setOpen(false)}
                      className={`treba-admin-nav-link ${(item[2] ? path.startsWith("/admin" + item[2]) && !(item[2] === "/sellers" && path.includes("applications")) : path === "/admin") ? "active" : ""}`}
                    >
                      <Icon name={item[3]} />
                      <span>
                        {user.role === "Seller" && item[2] === "/support"
                          ? "Питання покупців"
                          : item[1]}
                      </span>
                    </Link>
                  </div>
                ))}
            </nav>
            {user.role === "Seller" && (
              <Link className="treba-admin-nav-link" href="/admin/products/import">
                <Icon name="upload" />
                Імпорт товарів
              </Link>
            )}
          </div>
          <div className="treba-admin-sidebar-bottom">
            <span className="treba-admin-online-dot" />
            <span>Робочий простір TREBA</span>
            <Button
              tone="icon"
              onClick={() => void logout(true)}
              disabled={leaving}
              icon="logout"
            >
              На сайт
            </Button>
          </div>
        </aside>
        <div className="treba-admin-main">
          <header className="treba-admin-topbar">
            <div className="treba-admin-topbar-title">
              <button
                className="treba-admin-mobile-menu"
                aria-label="Відкрити меню"
                onClick={() => setOpen(true)}
              >
                <Icon name="menu" />
              </button>
              <span>
                TREBA <i>/</i> <b>{active[1]}</b>
              </span>
            </div>
            <div className="treba-admin-topbar-actions">
              <Link
                className="treba-admin-notification"
                href="/admin/notifications"
                aria-label={`Сповіщення: ${feed.data?.unreadCount ?? 0}`}
              >
                <Icon name="bell" />
                {!!feed.data?.unreadCount && (
                  <span>
                    {feed.data.unreadCount > 99 ? "99+" : feed.data.unreadCount}
                  </span>
                )}
              </Link>
              <Link className="treba-admin-profile-link" href="/admin/profile">
                <span className="treba-admin-avatar">
                  {user.firstName?.[0]}
                  {user.lastName?.[0]}
                </span>
                <span>
                  <b>
                    {user.firstName} {user.lastName}
                  </b>
                  <small>{roleLabel(user.role)}</small>
                </span>
              </Link>
              <button
                className="treba-admin-icon-button"
                aria-label="Вийти"
                onClick={() => void logout()}
                disabled={leaving}
              >
                <Icon name="logout" />
              </button>
            </div>
          </header>
          <main className="treba-admin-content">
            {canAccessAdmin(user.role, path) ? (
              children
            ) : (
              <Empty
                title="Доступ обмежено"
                description="Цей розділ недоступний для вашої ролі."
              />
            )}
          </main>
          <footer className="treba-admin-footer">
            <span>© TREBA · Робочий простір</span>
            <span>Часовий пояс: Europe/Vilnius</span>
          </footer>
        </div>
      </div>
    </StaffContext.Provider>
  );
}

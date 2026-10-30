"use client";
import { useAdminI18n } from "@/features/admin/i18n/provider";
import { message } from "@/features/admin/i18n/core";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { adminRequest, useResource } from "@/features/admin/api";
import { canAccessAdmin } from "@/lib/admin-access";
import { roleLabel, workspaceLabel } from "@/lib/admin";
import type { Feed, User } from "@/features/admin/types";
import Icon from "./Icon";
import LanguageSelector from "./LanguageSelector";
import UserAvatar from "./UserAvatar";
import { Alert, Button, Empty, Loading } from "./ui";
const StaffContext = createContext<{ user: User; updateUser: (user: User) => void } | null>(null);
export function useStaff() {
  const session = useContext(StaffContext);
  if (!session) throw new Error("Staff session required");
  return session.user;
}
export function useUpdateStaff() {
  const session = useContext(StaffContext);
  if (!session) throw new Error("Staff session required");
  return session.updateUser;
}
const nav = [
  [message("Робота"), message("Огляд"), "", "grid"],
  [message("Робота"), message("Замовлення"), "/orders", "bag"],
  [message("Робота"), message("Товари"), "/products", "box"],
  [message("Робота"), message("Модерація"), "/moderation", "shield"],
  [message("Робота"), message("Категорії"), "/categories", "layers"],
  [message("Люди"), message("Продавці"), "/sellers", "shop"],
  [
    message("Люди"),
    message("Заявки продавців"),
    "/sellers/applications",
    "users",
  ],
  [message("Люди"), message("Відгуки"), "/reviews", "star"],
  [message("Люди"), message("Підтримка"), "/support", "chat"],
  [message("Люди"), message("Покупці"), "/customer-activity", "chart"],
  [message("Просування"), message("Акції та промокоди"), "/loyalty", "gift"],
  [message("Система"), message("Користувачі"), "/users", "users"],
  [message("Система"), message("Налаштування"), "/settings", "settings"],
];
export default function AdminShell({ children }: { children: ReactNode }) {
  const { t, adoptProfileLanguage } = useAdminI18n();
  const session = useResource<{
      user: User;
    }>("session", 60000),
    path = usePathname();
  const [open, setOpen] = useState(false),
    [leaving, setLeaving] = useState(false);
  const user = session.data?.user;
  const { setData: setSessionData, reload: reloadSession } = session;
  const updateUser = useCallback((updated: User) => {
    setSessionData({ user: updated });
    void reloadSession();
  }, [setSessionData, reloadSession]);
  useEffect(() => {
    adoptProfileLanguage(user?.profile?.language);
  }, [adoptProfileLanguage, user?.profile?.language]);
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
        <LanguageSelector />
        <div className="treba-admin-brand-mark">
          T<span>•</span>
        </div>
        <Loading />
      </div>
    );
  if (!user)
    return (
      <div className="treba-admin-boot" data-treba-workspace="sign-in">
        <LanguageSelector />
        <div className="treba-admin-brand-mark">
          T<span>•</span>
        </div>
        <h1>{t("Робочий простір TREBA")}</h1>
        <Alert message={session.error} />
        <p>{t("Увійдіть як співробітник або продавець.")}</p>
        <Link
          className="treba-admin-button primary"
          href={"/login?next=" + encodeURIComponent(path)}
        >
          {t("Увійти")}
        </Link>
        <Button tone="secondary" onClick={() => void session.reload()}>
          {t("Спробувати ще раз")}
        </Button>
        <Link href="/">{t("На головну")}</Link>
      </div>
    );
  const active =
    nav
      .filter((n) => n[2] && path.startsWith("/admin" + n[2]))
      .sort((a, b) => b[2].length - a[2].length)[0] ?? nav[0];
  const activeTitle =
    path === "/admin/profile"
      ? t("Мій профіль")
      : path === "/admin/notifications"
        ? t("Сповіщення")
        : t(active[1]);
  return (
    <StaffContext.Provider value={{ user, updateUser }}>
      <div className="treba-admin-shell" data-treba-workspace="ready">
        {open && (
          <button
            className="treba-admin-nav-scrim"
            aria-label={t("Закрити меню")}
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
              <small>{t(workspaceLabel(user.role))}</small>
            </div>
          </Link>
          <div className="treba-admin-nav-scroll">
            <nav>
              {nav
                .filter((n) => canAccessAdmin(user.role, "/admin" + n[2]))
                .map((item, index, visible) => (
                  <div key={item[2]}>
                    {(index === 0 || visible[index - 1][0] !== item[0]) && (
                      <div className="treba-admin-nav-label">{t(item[0])}</div>
                    )}
                    <Link
                      href={"/admin" + item[2]}
                      onClick={() => setOpen(false)}
                      className={`treba-admin-nav-link ${(item[2] ? path.startsWith("/admin" + item[2]) && !(item[2] === "/sellers" && path.includes("applications")) : path === "/admin") ? "active" : ""}`}
                    >
                      <Icon name={item[3]} />
                      <span>
                        {user.role === "Seller" && item[2] === "/support"
                          ? t("Питання покупців")
                          : t(item[1])}
                      </span>
                    </Link>
                  </div>
                ))}
            </nav>
            {user.role === "Seller" && (
              <Link
                className="treba-admin-nav-link"
                href="/admin/products/import"
              >
                <Icon name="upload" />
                {t("Імпорт товарів")}
              </Link>
            )}
          </div>
          <div className="treba-admin-sidebar-bottom">
            <Button
              tone="icon"
              onClick={() => void logout(true)}
              disabled={leaving}
              icon="logout"
            >
              {t("На сайт")}
            </Button>
          </div>
        </aside>
        <div className="treba-admin-main">
          <header className="treba-admin-topbar">
            <div className="treba-admin-topbar-title">
              <button
                className="treba-admin-mobile-menu"
                aria-label={t("Відкрити меню")}
                onClick={() => setOpen(true)}
              >
                <Icon name="menu" />
              </button>
              <span>
                TREBA <i>/</i> <b>{activeTitle}</b>
              </span>
            </div>
            <div className="treba-admin-topbar-actions">
              <LanguageSelector />
              <Link
                className="treba-admin-notification"
                href="/admin/notifications"
                aria-label={t("Сповіщення: {0}", [feed.data?.unreadCount ?? 0])}
              >
                <Icon name="bell" />
                {!!feed.data?.unreadCount && (
                  <span>
                    {feed.data.unreadCount > 99 ? "99+" : feed.data.unreadCount}
                  </span>
                )}
              </Link>
              <Link className="treba-admin-profile-link" href="/admin/profile" aria-label={t("Мій профіль")}>
                <UserAvatar user={user} />
                <span>
                  <b>
                    {user.firstName} {user.lastName}
                  </b>
                  <small>{t(roleLabel(user.role) ?? "")}</small>
                </span>
              </Link>
              <button
                className="treba-admin-icon-button"
                aria-label={t("Вийти")}
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
                title={t("Доступ обмежено")}
                description={t("Цей розділ недоступний для вашої ролі.")}
              />
            )}
          </main>
          <footer className="treba-admin-footer">
            <span>© TREBA</span>
            <span>{t("Часовий пояс: Europe/Vilnius")}</span>
          </footer>
        </div>
      </div>
    </StaffContext.Provider>
  );
}

"use client";
import { useAdminI18n } from "@/features/admin/i18n/provider";
import { Empty } from "@/components/admin/ui";
import Overview from "./Overview";
import { Products, ProductEditor } from "./Catalog";
import {
  Customers,
  Orders,
  OrderDetails,
  Support,
  TicketDetails,
} from "./Operations";
import { Reviews, Sellers, Users } from "./People";
import Promotions from "./Promotions";
import Settings, { Categories } from "./Settings";
import Profile, { Notifications } from "./Profile";
import Imports from "./Imports";
export default function Workspace({ segments }: { segments: string[] }) {
  const { t } = useAdminI18n();
  const [section, id, action] = segments;
  if (!section) return <Overview />;
  if (section === "products") {
    if (id === "import") return <Imports />;
    if (id === "new" || action === "edit")
      return <ProductEditor key={id} id={id === "new" ? undefined : id} />;
    if (!id) return <Products />;
  }
  if (section === "moderation" && !id) return <Products moderation />;
  if (section === "categories" && !id) return <Categories />;
  if (section === "orders")
    return id ? <OrderDetails key={id} id={id} /> : <Orders />;
  if (section === "support")
    return id && id !== "trash" ? (
      <TicketDetails key={id} id={id} />
    ) : (
      <Support trash={id === "trash"} />
    );
  if (section === "sellers")
    return (
      <Sellers
        key={segments.join("/")}
        id={id === "review" ? action : undefined}
        create={id === "new"}
        applications={id === "applications"}
      />
    );
  if (section === "reviews" && !id) return <Reviews />;
  if (section === "customer-activity")
    return <Customers key={id ?? "list"} id={id} />;
  if (section === "loyalty")
    return (
      <Promotions
        key={id ?? "list"}
        id={id === "new" ? undefined : id}
        create={id === "new"}
      />
    );
  if (section === "users")
    return (
      <Users
        key={id ?? "list"}
        id={id === "create" ? undefined : id}
        create={id === "create"}
      />
    );
  if (section === "settings") return <Settings section={id} />;
  if (section === "profile" && !id) return <Profile />;
  if (section === "notifications" && !id) return <Notifications />;
  return (
    <Empty
      title={t("Сторінку не знайдено")}
      description={t("Оберіть потрібний розділ у меню робочого простору.")}
    />
  );
}

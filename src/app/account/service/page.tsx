"use client";

import AccountPageShell from "../../../components/account/AccountPageShell";
import PageTitle from "../../../components/account/PageTitle";
import EmptyState from "../../../components/account/EmptyState";

export default function ServicePage() {
  return (
    <AccountPageShell>
      <PageTitle>Сервіс та повернення</PageTitle>
      <EmptyState
        icon="/icons/returns.svg"
        title="Список заявок пустий"
        subtitle="Ви ще не створювали заявки на повернення чи гарантійне обслуговування"
      />
    </AccountPageShell>
  );
}
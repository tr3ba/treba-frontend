"use client";

import AccountPageShell from "../../../components/account/AccountPageShell";
import PageTitle from "../../../components/account/PageTitle";
import EmptyState from "../../../components/account/EmptyState";

export default function PromotionsPage() {
  return (
    <AccountPageShell>
      <PageTitle>Участь в акціях</PageTitle>
      <EmptyState
        icon="/icons/gamepad.svg"
        title="Список акцій пустий"
        subtitle="Ви ще не брали участь в акціях"
        actionLabel="Дивитись всі акції"
      />
    </AccountPageShell>
  );
}
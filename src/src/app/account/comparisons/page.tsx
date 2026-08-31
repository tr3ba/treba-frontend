"use client";

import AccountPageShell from "../../../components/account/AccountPageShell";
import PageTitle from "../../../components/account/PageTitle";
import EmptyState from "../../../components/account/EmptyState";

export default function ComparisonsPage() {
  return (
    <AccountPageShell>
      <PageTitle>Списки порівнянь</PageTitle>
      <EmptyState
        icon="/icons/circle.svg"
        title="Список порівнянь порожній"
        subtitle="Додавайте товари до порівняння прямо з каталогу, щоб було зручніше обрати найкращий варіант"
        actionLabel="Перейти в каталог"
      />
    </AccountPageShell>
  );
}
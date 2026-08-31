"use client";

import AccountPageShell from "../../../components/account/AccountPageShell";
import PageTitle from "../../../components/account/PageTitle";
import EmptyState from "../../../components/account/EmptyState";

export default function ProposalsPage() {
  return (
    <AccountPageShell>
      <PageTitle>Персональні пропозиції</PageTitle>
      <EmptyState
        icon="/icons/discount.svg"
        title="Поки що немає пропозицій"
        subtitle="Ми підбираємо персональні знижки на основі ваших покупок і переглядів — заходьте частіше!"
      />
    </AccountPageShell>
  );
}
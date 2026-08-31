"use client";

import AccountPageShell from "../../../components/account/AccountPageShell";
import PageTitle from "../../../components/account/PageTitle";
import EmptyState from "../../../components/account/EmptyState";

export default function SizesPage() {
  return (
    <AccountPageShell>
      <PageTitle>Розміри</PageTitle>
      <EmptyState
        icon="/icons/clothes.svg"
        title="Профілі відсутні"
        subtitle="Ви ще не створювали профілів з розмірами одягу — це допоможе швидше підбирати потрібний розмір"
        actionLabel="Створити профіль"
      />
    </AccountPageShell>
  );
}
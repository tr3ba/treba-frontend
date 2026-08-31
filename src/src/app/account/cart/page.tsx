"use client";

import AccountPageShell from "../../../components/account/AccountPageShell";
import PageTitle from "../../../components/account/PageTitle";
import EmptyState from "../../../components/account/EmptyState";

export default function CartPage() {
  return (
    <AccountPageShell>
      <PageTitle>Кошик</PageTitle>
      <EmptyState
        icon="/icons/shop.svg"
        title="Кошик порожній"
        subtitle="Але це ніколи не пізно виправити :) Перегляньте каталог і додайте щось цікаве."
        actionLabel="Перейти в каталог"
      />
    </AccountPageShell>
  );
}
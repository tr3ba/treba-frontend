"use client";

import AccountPageShell from "../../../components/account/AccountPageShell";
import PageTitle from "../../../components/account/PageTitle";
import EmptyState from "../../../components/account/EmptyState";
import InlineCheckRow from "../../../components/account/InlineCheckRow";

export default function CertificatesPage() {
  return (
    <AccountPageShell>
      <PageTitle>Подарункові сертифікати</PageTitle>

      <InlineCheckRow
        placeholder="Введіть код сертифіката для перевірки"
        buttonLabel="Перевірити"
      />

      <EmptyState
        icon="/icons/discount.svg"
        title="Сертифікатів немає"
        subtitle="Сертифікат TREBA — подарунок, який точно сподобається"
        actionLabel="Обрати та купити сертифікат"
      />
    </AccountPageShell>
  );
}
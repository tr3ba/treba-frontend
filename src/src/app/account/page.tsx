"use client";

import { useAuth } from "../../context/AuthContext";
import AccountPageShell from "../../components/account/AccountPageShell";
import AccountIdentityCard from "../../components/account/AccountIdentityCard";
import AccordionSection from "../../components/account/AccordionSection";

const genderOptions = [
  { value: "male", label: "Чоловіча" },
  { value: "female", label: "Жіноча" },
  { value: "unspecified", label: "Не хочу вказувати" },
];

const deliveryMethodOptions = [
  { value: "courier", label: "Кур'єром за адресою" },
  { value: "nova_poshta", label: "Відділення Нової пошти" },
  { value: "ukrposhta", label: "Відділення Укрпошти" },
];

const hobbyOptions = [
  { value: "home", label: "Дім" },
  { value: "garden", label: "Сад та город" },
  { value: "clothes", label: "Одяг і стиль" },
  { value: "tech", label: "Техніка та гаджети" },
  { value: "sport", label: "Спорт" },
  { value: "beauty", label: "Краса і здоров'я" },
  { value: "kids", label: "Діти" },
  { value: "animals", label: "Тварини" },
  { value: "travel", label: "Подорожі" },
  { value: "cooking", label: "Кулінарія" },
  { value: "books", label: "Книги" },
  { value: "games", label: "Ігри" },
  { value: "handmade", label: "Hand made" },
  { value: "auto", label: "Авто" },
];

const petOptions = [
  { value: "dogs", label: "Собаки" },
  { value: "cats", label: "Коти" },
  { value: "rodents", label: "Гризуни" },
  { value: "reptiles", label: "Рептилії" },
  { value: "birds", label: "Птахи" },
  { value: "fish", label: "Акваріумні риби" },
  { value: "cattle", label: "Великий рогатий скот" },
  { value: "smallLivestock", label: "Дрібна худоба" },
  { value: "none", label: "Немає тварин" },
];

const additionalInfoOptions = [
  { value: "no_receipt", label: "Не друкувати чеки та гарантійні талони" },
  { value: "no_call", label: "Не дзвонити перед доставкою" },
  { value: "sms_status", label: "Повідомляти про статус SMS" },
  { value: "email_status", label: "Повідомляти про статус на email" },
];

// Головна сторінка кабінету, тільки вміст правої колонки
function AccountOverview() {
  const { user, updateProfile } = useAuth();

  if (!user) return null;

  return (
    <>
      <AccountIdentityCard />

      <AccordionSection
        title="Особисті дані"
        defaultOpen
        fields={[
          {
            key: "gender",
            label: "Стать",
            value: user.gender ?? "",
            type: "radio",
            options: genderOptions,
          },
          {
  key: "birthDate",
  label: "Дата народження",
  value: user.birthDate ?? "",
  placeholder: "ДД.ММ.РРРР",
  mask: "date",
},
        ]}
        onSave={(values) => updateProfile(values)}
      />

      <AccordionSection
        title="Мої отримувачі замовлень"
        fields={[
          {
            key: "recipientFirstName",
            label: "Ім'я отримувача",
            value: user.recipientFirstName ?? "",
          },
          {
            key: "recipientLastName",
            label: "Прізвище отримувача",
            value: user.recipientLastName ?? "",
          },
          {
            key: "recipientPhone",
            label: "Телефон отримувача",
            value: user.recipientPhone ?? "",
            placeholder: "+38 (0__) ___ __ __",
          },
        ]}
        emptyText="Ви ще не додали отримувачів замовлень"
        onSave={(values) => updateProfile(values)}
      />

      <AccordionSection
        title="Контакти"
        readOnly
        fields={[{ key: "email", label: "Email (логін)", value: user.email }]}
        onSave={() => {}}
      />

      <AccordionSection
        title="Адреса доставки"
        fields={[
          { key: "addressCity", label: "Місто", value: user.addressCity ?? "" },
          { key: "addressStreet", label: "Вулиця", value: user.addressStreet ?? "" },
          {
            key: "addressBuilding",
            label: "Будинок / квартира",
            value: user.addressBuilding ?? "",
          },
          {
            key: "deliveryMethod",
            label: "Спосіб отримання",
            value: user.deliveryMethod ?? "",
            type: "radio",
            options: deliveryMethodOptions,
          },
          {
            key: "addressBranch",
            label: "Номер відділення (якщо обрано відділення)",
            value: user.addressBranch ?? "",
          },
        ]}
        emptyText="Адресу доставки ще не вказано"
        onSave={(values) => updateProfile(values)}
      />

      <AccordionSection
        title="Захоплення"
        fields={[
          {
            key: "hobbies",
            label: "Оберіть все, що вам цікаво",
            value: user.hobbies ?? "",
            type: "multiselect",
            options: hobbyOptions,
          },
        ]}
        emptyText="Оберіть, що вам цікаво — покажемо доречні пропозиції"
        onSave={(values) => updateProfile(values)}
      />

      <AccordionSection
        title="Домашні тварини"
        fields={[
          {
            key: "pets",
            label: "Оберіть, хто у вас живе",
            value: user.pets ?? "",
            type: "multiselect",
            options: petOptions,
          },
        ]}
        emptyText="Ще не вказано"
        onSave={(values) => updateProfile(values)}
      />

      <AccordionSection
        title="Додаткова інформація"
        fields={[
          {
            key: "additionalInfoOptions",
            label: "Побажання щодо замовлень",
            value: user.additionalInfoOptions ?? "",
            type: "multiselect",
            options: additionalInfoOptions,
          },
          {
            key: "additionalInfo",
            label: "Інші побажання",
            value: user.additionalInfo ?? "",
            multiline: true,
            placeholder: "Напишіть, якщо є щось, що не увійшло у пункти вище",
          },
        ]}
        emptyText="Немає додаткової інформації"
        onSave={(values) => updateProfile(values)}
      />
    </>
  );
}

export default function AccountPage() {
  return (
    <AccountPageShell>
      <AccountOverview />
    </AccountPageShell>
  );
}
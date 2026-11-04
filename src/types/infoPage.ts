// Інформаційні сторінки (футер, «угода користувача» тощо).

export type InfoPageSlug =
  | "about"
  | "terms"
  | "careers"
  | "contacts"
  | "delivery"
  | "warranty"
  | "returns"
  | "advertising"
  | "partnership";

/** Група — як колонки у футері. */
export type InfoPageGroup = "Про компанію" | "Допомога" | "Партнерам";

/** Блок тексту: необов'язковий підзаголовок, абзаци та/або список. */
export type InfoSection = {
  heading?: string;
  paragraphs?: string[];
  list?: string[];
};

/** Кнопка-дія внизу сторінки (наприклад, «Написати в чат»). */
export type InfoAction = {
  label: string;
  href: string;
};

export type InfoPage = {
  slug: InfoPageSlug;
  group: InfoPageGroup;
  title: string;
  /** Короткий опис під заголовком; також іде в meta description */
  description: string;
  sections: InfoSection[];
  action?: InfoAction;
};

/** Пункт бічного меню інфосторінок. */
export type InfoNavLink = {
  slug: InfoPageSlug;
  title: string;
};

export type InfoNavGroup = {
  group: InfoPageGroup;
  links: InfoNavLink[];
};
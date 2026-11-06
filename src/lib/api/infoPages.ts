// Інформаційні сторінки. Зараз тексти лежать у src/data/infoPages.ts.
// Якщо бэк додасть CMS-ендпоінт — міняються тільки тіла функцій нижче.
import type { InfoNavGroup, InfoPage, InfoPageGroup } from "../../types/infoPage";
import { INFO_PAGES } from "../../data/infoPages";

const GROUP_ORDER: InfoPageGroup[] = ["Про компанію", "Допомога", "Партнерам"];

export async function getInfoPage(slug: string): Promise<InfoPage | null> {
  return INFO_PAGES.find((page) => page.slug === slug) ?? null;
}

/** Бічне меню: сторінки, згруповані як у футері. */
export async function getInfoNavigation(): Promise<InfoNavGroup[]> {
  return GROUP_ORDER.map((group) => ({
    group,
    links: INFO_PAGES.filter((page) => page.group === group).map(({ slug, title }) => ({ slug, title })),
  }));
}
// Соцмережі для футера й головної. Власних акаунтів TREBA поки немає —
// ведемо на головні сторінки мереж. З'являться акаунти — міняємо тільки href тут.

export type SocialLink = {
  name: string;
  icon: string;
  href: string;
};

export const SOCIAL_LINKS: SocialLink[] = [
  { name: "TikTok", icon: "/icons/TikTok.svg", href: "https://www.tiktok.com" },
  { name: "Telegram", icon: "/icons/telegram.svg", href: "https://telegram.org" },
  { name: "Facebook", icon: "/icons/facebook.svg", href: "https://www.facebook.com" },
  { name: "YouTube", icon: "/icons/youtube.svg", href: "https://www.youtube.com" },
  { name: "Instagram", icon: "/icons/instagram.svg", href: "https://www.instagram.com" },
  { name: "X", icon: "/icons/x.svg", href: "https://x.com" },
];

/** Короткий набір для картки на головній. */
export const HOME_SOCIAL_NAMES = ["Facebook", "Instagram", "YouTube", "TikTok"];
import type { Metadata } from "next";
import { cookies } from "next/headers";
import AdminShell from "@/components/admin/AdminShell";
import { AdminI18nProvider } from "@/features/admin/i18n/provider";
import { languageCookie, normalizeLanguage } from "@/features/admin/i18n/core";
import "./admin.css";
export async function generateMetadata(): Promise<Metadata> {
  const language = normalizeLanguage(
    (await cookies()).get(languageCookie)?.value,
  );
  return {
    title: {
      default:
        language === "en" ? "TREBA · Workspace" : "TREBA · Робочий простір",
      template: "%s · TREBA",
    },
    robots: { index: false, follow: false },
  };
}
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const preferred = (await cookies()).get(languageCookie)?.value;
  return (
    <AdminI18nProvider
      initialLanguage={preferred ? normalizeLanguage(preferred) : undefined}
    >
      <AdminShell>{children}</AdminShell>
    </AdminI18nProvider>
  );
}

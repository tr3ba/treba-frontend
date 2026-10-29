"use client";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  formatDate,
  formatMoney,
  languageCookie,
  normalizeLanguage,
  translate,
  translateError,
  translateStatus,
  type AdminLanguage,
} from "./core";

function createValue(
  language: AdminLanguage,
  setLanguage: (value: AdminLanguage) => void,
  adoptProfileLanguage: (value?: string) => void,
) {
  return {
    language,
    setLanguage,
    adoptProfileLanguage,
    t: (key: string, values?: readonly unknown[]) =>
      translate(language, key, values),
    label: (value: string) => translateStatus(language, value),
    date: (value?: string) => formatDate(language, value),
    money: (value: number, currency?: string) =>
      formatMoney(language, value, currency),
    error: (value: string) => translateError(language, value),
  };
}
const Context = createContext<ReturnType<typeof createValue> | null>(null);
export function AdminI18nProvider({
  initialLanguage,
  manageDocumentTitle = true,
  children,
}: {
  initialLanguage?: AdminLanguage;
  manageDocumentTitle?: boolean;
  children: ReactNode;
}) {
  const [language, updateLanguage] = useState<AdminLanguage>(
    initialLanguage ?? "uk",
  );
  const [explicitPreference, setExplicitPreference] =
    useState(!!initialLanguage);
  const setLanguage = useCallback((next: AdminLanguage) => {
    setExplicitPreference(true);
    updateLanguage(next);
    document.cookie = `${languageCookie}=${next}; Path=/; Max-Age=31536000; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`;
  }, []);
  const adoptProfileLanguage = useCallback(
    (next?: string) => {
      if (!explicitPreference && next) updateLanguage(normalizeLanguage(next));
    },
    [explicitPreference],
  );
  useEffect(() => {
    const previous = document.documentElement.lang;
    document.documentElement.lang = language;
    if (manageDocumentTitle)
      document.title =
        language === "en" ? "TREBA · Workspace" : "TREBA · Робочий простір";
    return () => {
      document.documentElement.lang = previous;
    };
  }, [language, manageDocumentTitle]);
  const value = useMemo(
    () => createValue(language, setLanguage, adoptProfileLanguage),
    [language, setLanguage, adoptProfileLanguage],
  );
  return (
    <Context.Provider value={value}>
      <div lang={language} className="treba-admin-locale">
        {children}
      </div>
    </Context.Provider>
  );
}
export function useAdminI18n() {
  const value = useContext(Context);
  if (!value) throw new Error("AdminI18nProvider is required");
  return value;
}

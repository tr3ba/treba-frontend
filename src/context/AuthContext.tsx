"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { accountRequest, type Preferences } from "../lib/api/account";

export type UserProfile = {
  phone?: string; lastName?: string; firstName?: string; patronymic?: string; gender?: string; birthDate?: string;
  recipients?: string; address?: string; hobbies?: string; pets?: string; additionalInfo?: string;
  recipientFirstName?: string; recipientLastName?: string; recipientPhone?: string;
  addressCity?: string; addressStreet?: string; addressBuilding?: string; deliveryMethod?: string; addressBranch?: string;
  additionalInfoOptions?: string;
};
export type User = { id: string; name: string; email: string; role?: string } & UserProfile;
export type LoginChallenge = { challengeId: string; methods: string[]; maskedEmail: string; expiresAt: string };
export type LoginResult = { challenge: LoginChallenge; user?: never } | { user: User; challenge?: never };
type AuthContextValue = {
  user: User | null; isLoading: boolean;
  register: (name: string, email: string, password: string, profile?: UserProfile) => Promise<void>;
  login: (email: string, password: string, remember?: boolean) => Promise<LoginResult>;
  verify: (challengeId: string, method: string, code: string, remember?: boolean) => Promise<User>;
  sendEmailCode: (challengeId: string) => Promise<void>;
  verifyGuard: (id: string, browserSecret: string, remember?: boolean) => Promise<User>;
  logout: () => Promise<void>; updateProfile: (patch: UserProfile) => Promise<void>;
};
const AuthContext = createContext<AuthContextValue | undefined>(undefined);
const preferenceKeys = ["phone", "lastName", "firstName", "patronymic", "gender", "birthDate", "recipients", "address", "hobbies", "pets", "additionalInfo", "recipientFirstName", "recipientLastName", "recipientPhone", "addressCity", "addressStreet", "addressBuilding", "deliveryMethod", "addressBranch", "additionalInfoOptions"] as const;
function withPreferences(user: User, values: Record<string, string>): User {
  const preferences: UserProfile = {};
  for (const key of preferenceKeys) if (typeof values[key] === "string") preferences[key] = values[key];
  return { ...user, ...preferences, name: `${preferences.firstName ?? user.firstName ?? user.name} ${preferences.lastName ?? user.lastName ?? ""}`.trim() };
}
export async function sessionRequest(body?: unknown) {
  const response = await fetch("/shop-api/session", { method: body ? "POST" : "GET", cache: "no-store", headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message ?? "Не вдалося увійти в акаунт.");
  return result;
}
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [preferencesVersion, setPreferencesVersion] = useState<string | null>(null);
  useEffect(() => {
    // Retire the old demo identities and plaintext passwords. API sessions live in HttpOnly cookies.
    try {
      for (const key of ["treba_users", "treba_session"]) localStorage.removeItem(key);
      for (const key of ["treba_demo_users", "treba_demo_session"]) sessionStorage.removeItem(key);
    } catch { /* Cookie authentication also works when browser storage is unavailable. */ }
    let active = true;
    void sessionRequest().then(async result => {
      if (!result.user) return;
      let loaded = result.user;
      try { const preferences = await accountRequest<Preferences>("preferences"); loaded = withPreferences(result.user, preferences.values); if (active) setPreferencesVersion(preferences.version); } catch { /* Profile writes retry this request before saving. */ }
      if (active) setUser(loaded);
    }).catch(() => {}).finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);
  async function register(name: string, email: string, password: string, profile?: UserProfile) {
    const result = await sessionRequest({ action: "register", email, password, firstName: profile?.firstName ?? name.split(" ")[0], lastName: profile?.lastName ?? name.split(" ").slice(1).join(" "), phone: profile?.phone });
    await acceptUser(result.user);
  }
  async function acceptUser(value: User | null | undefined): Promise<User> {
    if (!value?.id) throw new Error("Не вдалося підтвердити вхід.");
    let authenticatedUser = value;
    setPreferencesVersion(null);
    try { const preferences = await accountRequest<Preferences>("preferences"); authenticatedUser = withPreferences(value, preferences.values); setPreferencesVersion(preferences.version); } catch { /* Authentication succeeds even if preferences are temporarily unavailable. */ }
    setUser(authenticatedUser);
    return authenticatedUser;
  }
  async function login(email: string, password: string, remember = true): Promise<LoginResult> {
    const result = await sessionRequest({ action: "login", email, password, remember });
    if (result.challenge) return { challenge: result.challenge as LoginChallenge };
    return { user: await acceptUser(result.user) };
  }
  async function verify(challengeId: string, method: string, code: string, remember = true) {
    const result = await sessionRequest({ action: "verify", challengeId, method, code, remember });
    return acceptUser(result.user);
  }
  async function sendEmailCode(challengeId: string) { await sessionRequest({ action: "email", challengeId }); }
  async function verifyGuard(id: string, browserSecret: string, remember = true) {
    const result = await sessionRequest({ action: "guard-complete", id, browserSecret, remember });
    return acceptUser(result.user);
  }
  async function logout() { try { await sessionRequest({ action: "logout" }); } finally { setUser(null); setPreferencesVersion(null); } }
  async function updateProfile(patch: UserProfile) {
    if (!user) throw new Error("Потрібно увійти в акаунт.");
    const version = preferencesVersion ?? (await accountRequest<Preferences>("preferences")).version;
    const result = await accountRequest<Preferences>("preferences", { method: "PATCH", body: { values: patch, version } });
    setPreferencesVersion(result.version);
    setUser(previous => previous?.id === user.id ? withPreferences(previous, result.values) : previous);
  }
  return <AuthContext.Provider value={{ user, isLoading, register, login, verify, sendEmailCode, verifyGuard, logout, updateProfile }}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth має використовуватися всередині AuthProvider");
  return context;
}

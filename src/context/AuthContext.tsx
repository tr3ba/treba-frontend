"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";


export type UserProfile = {
  phone?: string;
  lastName?: string;
  firstName?: string;
  patronymic?: string;
  gender?: string;
  birthDate?: string;
  recipients?: string;
  address?: string;
  hobbies?: string;
  pets?: string;
  additionalInfo?: string;

  // Отримувач замовлення 
  recipientFirstName?: string;
  recipientLastName?: string;
  recipientPhone?: string;

  // Адреса доставки 
  addressCity?: string;
  addressStreet?: string;
  addressBuilding?: string;
  deliveryMethod?: string;
  addressBranch?: string;

  // Побажання щодо замовлень 
  additionalInfoOptions?: string;
};

type User = {
  id: string;
  name: string;
  email: string;
} & UserProfile;

type StoredUser = User & { password: string };

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  register: (
    name: string,
    email: string,
    password: string,
    profile?: UserProfile
  ) => void;
  login: (email: string, password: string) => void;
  logout: () => void;
  updateProfile: (patch: UserProfile) => void;
};

const USERS_KEY = "treba_users";
const SESSION_KEY = "treba_session";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getStoredUsers(): StoredUser[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(USERS_KEY);
    return raw ? (JSON.parse(raw) as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function saveStoredUsers(users: StoredUser[]) {
  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(SESSION_KEY);
      if (raw) {
        setUser(JSON.parse(raw) as User);
      }
    } catch {
    } finally {
      setIsLoading(false);
    }
  }, []);

  function register(
    name: string,
    email: string,
    password: string,
    profile?: UserProfile
  ) {
    const normalizedEmail = email.trim().toLowerCase();
    const users = getStoredUsers();

    if (users.some((u) => u.email === normalizedEmail)) {
      throw new Error("Користувач з таким email вже зареєстрований");
    }

    const newUser: StoredUser = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: normalizedEmail,
      password,
      ...profile,
    };

    saveStoredUsers([...users, newUser]);

    const { password: _password, ...sessionUser } = newUser;
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
  }

  function login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const users = getStoredUsers();
    const found = users.find((u) => u.email === normalizedEmail);

    if (!found || found.password !== password) {
      throw new Error("Невірний email або пароль");
    }

    const { password: _password, ...sessionUser } = found;
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
  }

  function logout() {
    window.localStorage.removeItem(SESSION_KEY);
    setUser(null);
  }

  
  function updateProfile(patch: UserProfile) {
    setUser((prev) => {
      if (!prev) return prev;
      const updated: User = { ...prev, ...patch };

      window.localStorage.setItem(SESSION_KEY, JSON.stringify(updated));

      const users = getStoredUsers();
      const nextUsers = users.map((u) =>
        u.id === updated.id ? { ...u, ...patch } : u
      );
      saveStoredUsers(nextUsers);

      return updated;
    });
  }

  return (
    <AuthContext.Provider
      value={{ user, isLoading, register, login, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth должен использоваться внутри AuthProvider");
  }
  return ctx;
}
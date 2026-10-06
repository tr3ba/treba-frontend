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

/**
 * DEMO AUTH ONLY.
 *
 * Пароль тимчасово потрібен для локального demo-login.
 * Дані зберігаються лише в sessionStorage і зникають після
 * завершення браузерної сесії.
 *
 * У production ця логіка має бути замінена backend authentication.
 */
type DemoStoredUser = User & {
  password: string;
};

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

const DEMO_USERS_KEY = "treba_demo_users";
const DEMO_SESSION_KEY = "treba_demo_session";

// Старі ключі, де пароль раніше зберігався постійно.
const LEGACY_USERS_KEY = "treba_users";
const LEGACY_SESSION_KEY = "treba_session";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getDemoUsers(): DemoStoredUser[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.sessionStorage.getItem(DEMO_USERS_KEY);

    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);

    return Array.isArray(parsed) ? (parsed as DemoStoredUser[]) : [];
  } catch {
    return [];
  }
}

function saveDemoUsers(users: DemoStoredUser[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(DEMO_USERS_KEY, JSON.stringify(users));
}

function createSessionUser(storedUser: DemoStoredUser): User {
  const user = { ...storedUser };

  delete (user as Partial<DemoStoredUser>).password;

  return user;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      /**
       * Видаляємо стару demo-auth інформацію,
       * яка могла містити пароль у persistent localStorage.
       */
      window.localStorage.removeItem(LEGACY_USERS_KEY);
      window.localStorage.removeItem(LEGACY_SESSION_KEY);

      const raw = window.sessionStorage.getItem(DEMO_SESSION_KEY);

      if (raw) {
        const parsed: unknown = JSON.parse(raw);

        if (parsed && typeof parsed === "object") {
          setUser(parsed as User);
        }
      }
    } catch {
      window.sessionStorage.removeItem(DEMO_SESSION_KEY);
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
    const normalizedName = name.trim();
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedName) {
      throw new Error("Вкажіть ім'я");
    }

    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      throw new Error("Вкажіть коректний email");
    }

    if (!password) {
      throw new Error("Вкажіть пароль");
    }

    const users = getDemoUsers();

    if (users.some((existingUser) => existingUser.email === normalizedEmail)) {
      throw new Error("Користувач з таким email вже зареєстрований");
    }

    const newUser: DemoStoredUser = {
      id: crypto.randomUUID(),
      name: normalizedName,
      email: normalizedEmail,
      password,
      ...profile,
    };

    saveDemoUsers([...users, newUser]);

    const sessionUser = createSessionUser(newUser);

    window.sessionStorage.setItem(
      DEMO_SESSION_KEY,
      JSON.stringify(sessionUser)
    );

    setUser(sessionUser);
  }

  function login(email: string, password: string) {
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      throw new Error("Вкажіть email та пароль");
    }

    const users = getDemoUsers();

    const foundUser = users.find(
      (storedUser) => storedUser.email === normalizedEmail
    );

    if (!foundUser || foundUser.password !== password) {
      throw new Error("Невірний email або пароль");
    }

    const sessionUser = createSessionUser(foundUser);

    window.sessionStorage.setItem(
      DEMO_SESSION_KEY,
      JSON.stringify(sessionUser)
    );

    setUser(sessionUser);
  }

  function logout() {
    window.sessionStorage.removeItem(DEMO_SESSION_KEY);
    setUser(null);
  }

  function updateProfile(patch: UserProfile) {
    setUser((previousUser) => {
      if (!previousUser) {
        return previousUser;
      }

      const updatedUser: User = {
        ...previousUser,
        ...patch,
      };

      window.sessionStorage.setItem(
        DEMO_SESSION_KEY,
        JSON.stringify(updatedUser)
      );

      const users = getDemoUsers();

      const updatedUsers = users.map((storedUser) =>
        storedUser.id === updatedUser.id
          ? {
              ...storedUser,
              ...patch,
            }
          : storedUser
      );

      saveDemoUsers(updatedUsers);

      return updatedUser;
    });
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        register,
        login,
        logout,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth має використовуватися всередині AuthProvider"
    );
  }

  return context;
}

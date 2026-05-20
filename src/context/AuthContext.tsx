import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  signIn as localSignIn,
  signUp as localSignUp,
  signOut as localSignOut,
  getCurrentUser,
  type LocalUser,
} from "@/lib/local-auth";

export type Role = "admin" | "user" | null;

interface AuthCtx {
  user: LocalUser | null;
  role: Role;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getCurrentUser());
    setLoading(false);
  }, []);

  const role: Role = user?.role ?? null;

  const signIn = async (email: string, password: string) => {
    const { user: u, error } = await localSignIn(email, password);
    if (u) setUser(u);
    return { error: error ?? null };
  };

  const signUp = async (email: string, password: string) => {
    const { user: u, error } = await localSignUp(email, password);
    if (u) setUser(u);
    return { error: error ?? null };
  };

  const signOut = async () => {
    localSignOut();
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, role, loading, signIn, signUp, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

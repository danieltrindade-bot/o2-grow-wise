const AUTH_KEY = "o2-auth-session";
const USERS_KEY = "o2-auth-users";

export interface LocalUser {
  id: string;
  email: string;
  role: "admin" | "user";
}

export interface LocalSession {
  user: LocalUser;
  loggedInAt: string;
}

function getUsers(): Array<{ id: string; email: string; passwordHash: string; role: "admin" | "user" }> {
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveUsers(users: Array<{ id: string; email: string; passwordHash: string; role: "admin" | "user" }>): void {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function signUp(email: string, password: string): Promise<{ user?: LocalUser; error?: string }> {
  if (!email.endsWith("@o2inc.com.br")) {
    return { error: "Apenas emails @o2inc.com.br podem se registrar." };
  }
  const users = getUsers();
  if (users.find((u) => u.email === email)) {
    return { error: "Email já cadastrado." };
  }
  const pwHash = await hashPassword(password);
  const newUser = { id: crypto.randomUUID(), email, passwordHash: pwHash, role: "admin" as const };
  saveUsers([...users, newUser]);
  const session: LocalSession = { user: { id: newUser.id, email: newUser.email, role: newUser.role }, loggedInAt: new Date().toISOString() };
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
  return { user: session.user };
}

export async function signIn(email: string, password: string): Promise<{ user?: LocalUser; error?: string }> {
  const users = getUsers();
  const user = users.find((u) => u.email === email);
  if (!user) return { error: "Credenciais inválidas." };
  const pwHash = await hashPassword(password);
  if (user.passwordHash !== pwHash) return { error: "Credenciais inválidas." };
  const session: LocalSession = { user: { id: user.id, email: user.email, role: user.role }, loggedInAt: new Date().toISOString() };
  localStorage.setItem(AUTH_KEY, JSON.stringify(session));
  return { user: session.user };
}

export function signOut(): void {
  localStorage.removeItem(AUTH_KEY);
}

export function getSession(): LocalSession | null {
  const raw = localStorage.getItem(AUTH_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function getCurrentUser(): LocalUser | null {
  return getSession()?.user ?? null;
}

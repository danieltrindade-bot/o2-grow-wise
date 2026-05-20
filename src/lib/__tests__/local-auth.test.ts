import { describe, it, expect, beforeEach, vi } from "vitest";

const mockStorage = new Map<string, string>();

const localStorageMock: Storage = {
  getItem: (key: string) => mockStorage.get(key) ?? null,
  setItem: (key: string, value: string) => { mockStorage.set(key, value); },
  removeItem: (key: string) => { mockStorage.delete(key); },
  clear: () => mockStorage.clear(),
  get length() { return mockStorage.size; },
  key: (index: number) => [...mockStorage.keys()][index] ?? null,
};

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock, writable: true });

vi.stubGlobal("crypto", {
  randomUUID: () => "test-uuid-" + Math.random().toString(36).slice(2, 9),
  subtle: {
    digest: async (_algo: string, data: ArrayBuffer) => {
      const bytes = new Uint8Array(data);
      const hash = new Uint8Array(32);
      for (let i = 0; i < bytes.length; i++) {
        hash[i % 32] ^= bytes[i];
      }
      return hash.buffer;
    },
  },
});

import { signUp, signIn, signOut, getCurrentUser, getSession } from "../local-auth";

describe("local-auth", () => {
  beforeEach(() => {
    mockStorage.clear();
  });

  describe("signUp", () => {
    it("creates a new user with valid @o2inc.com.br email", async () => {
      const result = await signUp("test@o2inc.com.br", "password123");
      expect(result.error).toBeUndefined();
      expect(result.user).toBeDefined();
      expect(result.user!.email).toBe("test@o2inc.com.br");
      expect(result.user!.role).toBe("admin");
    });

    it("sets session after signup", async () => {
      await signUp("test@o2inc.com.br", "password123");
      const session = getSession();
      expect(session).not.toBeNull();
      expect(session!.user.email).toBe("test@o2inc.com.br");
      expect(session!.loggedInAt).toBeDefined();
    });

    it("rejects non-o2 domain email", async () => {
      const result = await signUp("test@gmail.com", "password123");
      expect(result.error).toBe("Apenas emails @o2inc.com.br podem se registrar.");
      expect(result.user).toBeUndefined();
    });

    it("rejects duplicate email", async () => {
      await signUp("test@o2inc.com.br", "password123");
      const result = await signUp("test@o2inc.com.br", "other_password");
      expect(result.error).toBe("Email já cadastrado.");
      expect(result.user).toBeUndefined();
    });
  });

  describe("signIn", () => {
    beforeEach(async () => {
      await signUp("admin@o2inc.com.br", "correctpassword");
      signOut();
    });

    it("signs in with correct credentials", async () => {
      const result = await signIn("admin@o2inc.com.br", "correctpassword");
      expect(result.error).toBeUndefined();
      expect(result.user).toBeDefined();
      expect(result.user!.email).toBe("admin@o2inc.com.br");
    });

    it("rejects wrong password", async () => {
      const result = await signIn("admin@o2inc.com.br", "wrongpassword");
      expect(result.error).toBe("Credenciais inválidas.");
      expect(result.user).toBeUndefined();
    });

    it("rejects nonexistent user", async () => {
      const result = await signIn("nobody@o2inc.com.br", "password");
      expect(result.error).toBe("Credenciais inválidas.");
      expect(result.user).toBeUndefined();
    });

    it("sets session after signin", async () => {
      await signIn("admin@o2inc.com.br", "correctpassword");
      const user = getCurrentUser();
      expect(user).not.toBeNull();
      expect(user!.email).toBe("admin@o2inc.com.br");
    });
  });

  describe("signOut", () => {
    it("clears the session", async () => {
      await signUp("test@o2inc.com.br", "password123");
      expect(getCurrentUser()).not.toBeNull();
      signOut();
      expect(getCurrentUser()).toBeNull();
      expect(getSession()).toBeNull();
    });
  });

  describe("getCurrentUser", () => {
    it("returns null when no session exists", () => {
      expect(getCurrentUser()).toBeNull();
    });

    it("returns user when session exists", async () => {
      await signUp("test@o2inc.com.br", "password123");
      const user = getCurrentUser();
      expect(user).not.toBeNull();
      expect(user!.email).toBe("test@o2inc.com.br");
      expect(user!.id).toBeDefined();
      expect(user!.role).toBe("admin");
    });
  });
});

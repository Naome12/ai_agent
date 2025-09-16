import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "job_seeker" | "employer" | "admin";

export interface User {
  id: string;
  email: string;
  fname: string;
  lname: string;
  phone?: string;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  selectedRole: UserRole | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (userData: Omit<User, "id"> & { password: string }) => Promise<void>;
  logout: () => void;
  setUserRole: (role: UserRole) => void;
  setSelectedRole: (role: UserRole) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      selectedRole: null,

      /** Login with backend */
      login: async (email: string, password: string) => {
        try {
          const res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });

          if (!res.ok) throw new Error("Login failed");

          const data = await res.json();
          const decoded: User = parseJwt(data.accessToken);

          set({
            user: decoded,
            token: data.accessToken,
            isAuthenticated: true,
          });
        } catch (error: any) {
          throw new Error(error.message || "Invalid credentials");
        }
      },

      /** Signup with backend */
      signup: async (userData) => {
        try {
          const res = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userData),
          });

          if (!res.ok) throw new Error("Signup failed");

          const data = await res.json();
          const decoded: User = parseJwt(data.accessToken);

          set({
            user: decoded,
            token: data.accessToken,
            isAuthenticated: true,
          });
        } catch (error: any) {
          throw new Error(error.message || "Signup failed");
        }
      },

      /** Logout */
      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },

      /** Update role of current user */
      setUserRole: (role: UserRole) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, role } });
        }
      },

      /** Just selects role before signup/login */
      setSelectedRole: (role: UserRole) => {
        set({ selectedRole: role });
      },
    }),
    {
      name: "auth-storage",
    }
  )
);

/** Utility: Decode JWT (no verification, just decode payload) */
function parseJwt(token: string): any {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => {
          return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

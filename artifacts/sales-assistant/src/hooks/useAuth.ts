import { useState, useEffect, createContext, useContext } from "react";

export interface AdminMe {
  id: number;
  username: string;
  name: string;
  email: string;
  isSuperAdmin: boolean;
  hasAvatar: boolean;
}

interface AuthState {
  loggedIn: boolean;
  loading: boolean;
  me: AdminMe | null;
}

interface AuthContextValue extends AuthState {
  login: () => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  loggedIn: false,
  loading: true,
  me: null,
  login: () => {},
  logout: async () => {},
  refresh: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function useAuthProvider(): AuthContextValue {
  const [auth, setAuth] = useState<AuthState>({ loggedIn: false, loading: true, me: null });

  const check = async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = (await res.json()) as
          | { loggedIn: false }
          | ({ loggedIn: true } & AdminMe);
        if (data.loggedIn) {
          setAuth({
            loggedIn: true,
            loading: false,
            me: {
              id: data.id,
              username: data.username,
              name: data.name,
              email: data.email,
              isSuperAdmin: data.isSuperAdmin,
              hasAvatar: data.hasAvatar,
            },
          });
        } else {
          setAuth({ loggedIn: false, loading: false, me: null });
        }
      } else {
        setAuth({ loggedIn: false, loading: false, me: null });
      }
    } catch {
      setAuth({ loggedIn: false, loading: false, me: null });
    }
  };

  useEffect(() => { void check(); }, []);

  const login = () => {
    // Mark briefing as pending and snapshot "since" timestamp so the modal can
    // show "what's new since your last login" on every fresh admin login.
    try {
      const prev = window.localStorage.getItem("niwe.admin.lastSeenBriefing");
      const since =
        prev ??
        (() => {
          const d = new Date();
          d.setHours(0, 0, 0, 0);
          d.setDate(d.getDate() - 1);
          return d.toISOString();
        })();
      window.sessionStorage.setItem("niwe.admin.briefingSince", since);
      window.sessionStorage.setItem("niwe.admin.briefingPending", "1");
    } catch {
      /* ignore storage errors */
    }
    // Eagerly mark logged-in so the redirect is snappy, then re-fetch the full
    // profile so isSuperAdmin / avatar / name are correct on the next render.
    setAuth((s) => ({ ...s, loggedIn: true, loading: false }));
    void check();
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setAuth({ loggedIn: false, loading: false, me: null });
  };

  return { ...auth, login, logout, refresh: check };
}

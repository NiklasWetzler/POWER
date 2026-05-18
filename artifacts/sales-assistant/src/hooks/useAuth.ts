import { useState, useEffect, createContext, useContext } from "react";

interface AuthState {
  loggedIn: boolean;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: () => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  loggedIn: false,
  loading: true,
  login: () => {},
  logout: async () => {},
  refresh: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function useAuthProvider(): AuthContextValue {
  const [auth, setAuth] = useState<AuthState>({ loggedIn: false, loading: true });

  const check = async () => {
    try {
      const res = await fetch("/api/auth/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json() as { loggedIn: boolean };
        setAuth({ loggedIn: data.loggedIn, loading: false });
      } else {
        setAuth({ loggedIn: false, loading: false });
      }
    } catch {
      setAuth({ loggedIn: false, loading: false });
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
    setAuth({ loggedIn: true, loading: false });
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setAuth({ loggedIn: false, loading: false });
  };

  return { ...auth, login, logout, refresh: check };
}

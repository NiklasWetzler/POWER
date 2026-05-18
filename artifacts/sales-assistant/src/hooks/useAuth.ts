import { useState, useEffect } from "react";

interface AuthState {
  loggedIn: boolean;
  loading: boolean;
}

export function useAuth() {
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

  useEffect(() => {
    void check();
  }, []);

  const login = () => setAuth({ loggedIn: true, loading: false });

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    setAuth({ loggedIn: false, loading: false });
  };

  return { ...auth, login, logout, refresh: check };
}

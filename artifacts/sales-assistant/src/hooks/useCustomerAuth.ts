import { useState, useEffect, createContext, useContext } from "react";

interface CustomerInfo {
  id: number;
  name: string;
  email: string;
}

interface CustomerAuthState {
  loggedIn: boolean;
  loading: boolean;
  customer: CustomerInfo | null;
}

interface CustomerAuthContextValue extends CustomerAuthState {
  login: (customer: CustomerInfo) => void;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

export const CustomerAuthContext = createContext<CustomerAuthContextValue>({
  loggedIn: false,
  loading: true,
  customer: null,
  login: () => {},
  logout: async () => {},
  refresh: async () => {},
});

export function useCustomerAuth() {
  return useContext(CustomerAuthContext);
}

export function useCustomerAuthProvider(): CustomerAuthContextValue {
  const [state, setState] = useState<CustomerAuthState>({ loggedIn: false, loading: true, customer: null });

  const check = async () => {
    try {
      const res = await fetch("/api/customer/me", { credentials: "include" });
      if (res.ok) {
        const data = await res.json() as { loggedIn: boolean; customer?: CustomerInfo };
        setState({ loggedIn: data.loggedIn, loading: false, customer: data.customer ?? null });
      } else {
        setState({ loggedIn: false, loading: false, customer: null });
      }
    } catch {
      setState({ loggedIn: false, loading: false, customer: null });
    }
  };

  useEffect(() => { void check(); }, []);

  const login = (customer: CustomerInfo) => setState({ loggedIn: true, loading: false, customer });

  const logout = async () => {
    await fetch("/api/customer/logout", { method: "POST", credentials: "include" });
    setState({ loggedIn: false, loading: false, customer: null });
  };

  return { ...state, login, logout, refresh: check };
}

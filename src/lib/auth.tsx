"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, clearSession, getOrgId, getToken, setSession } from "@/lib/api";
import { MOCK_ENABLED, MOCK_SESSION } from "@/lib/mock-data";

interface AuthState {
  token: string | null;
  orgId: string | null;
  orgName: string | null;
  role: string | null;
}

interface AuthContextValue extends AuthState {
  /** True until the initial localStorage hydration completes. */
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (params: {
    name: string;
    slug: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
}

const ORG_NAME_KEY = "rtai.org_name";
const ROLE_KEY = "rtai.role";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    orgId: null,
    orgName: null,
    role: null,
  });
  const [loading, setLoading] = useState(true);

  // Hydrate from localStorage on mount.
  useEffect(() => {
    // Mock mode: seed a fake session so the app renders as logged-in.
    if (MOCK_ENABLED) {
      setState({
        token: MOCK_SESSION.token,
        orgId: MOCK_SESSION.orgId,
        orgName: MOCK_SESSION.orgName,
        role: MOCK_SESSION.role,
      });
      setLoading(false);
      return;
    }
    setState({
      token: getToken(),
      orgId: getOrgId(),
      orgName: window.localStorage.getItem(ORG_NAME_KEY),
      role: window.localStorage.getItem(ROLE_KEY),
    });
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.auth.login(email, password);
    setSession(res.access_token, res.org_id);
    window.localStorage.setItem(ORG_NAME_KEY, res.org_name);
    window.localStorage.setItem(ROLE_KEY, res.role);
    setState({
      token: res.access_token,
      orgId: res.org_id,
      orgName: res.org_name,
      role: res.role,
    });
  }, []);

  const register = useCallback(
    async (params: { name: string; slug: string; email: string; password: string }) => {
      await api.auth.register(params);
      // Backend creates the org + admin user; log in immediately.
      await login(params.email, params.password);
    },
    [login]
  );

  const logout = useCallback(() => {
    clearSession();
    window.localStorage.removeItem(ORG_NAME_KEY);
    window.localStorage.removeItem(ROLE_KEY);
    setState({ token: null, orgId: null, orgName: null, role: null });
  }, []);

  const value: AuthContextValue = {
    ...state,
    loading,
    isAuthenticated: !!state.token,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

// ─────────────────────────────────────────────────────────────────────────────
// FILE: smartmenuai/frontend/lib/auth-context.jsx
// ─────────────────────────────────────────────────────────────────────────────
"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi, businessApi, getToken, clearToken } from "./api";

const AuthContext = createContext(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

export function AuthProvider({ children }) {
  const [state, setState] = useState({
    user: null,
    profile: null,
    employee: null,
    business: null,
    loading: true,
    error: null,
  });

  const loadSession = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    try {
      const strapiUser = await authApi.me();
      const ctx = await businessApi.getMyBusiness();
      setState({
        user: strapiUser,
        profile: ctx.profile,
        employee: ctx.employee,
        business: ctx.business,
        loading: false,
        error: null,
      });
    } catch {
      clearToken();
      setState({
        user: null,
        profile: null,
        employee: null,
        business: null,
        loading: false,
        error: null,
      });
    }
  }, []);

  useEffect(() => { loadSession(); }, [loadSession]);

  const login = async (identifier, password) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { user } = await authApi.login(identifier, password);
      const ctx = await businessApi.getMyBusiness();
      setState({
        user,
        profile: ctx.profile,
        employee: ctx.employee,
        business: ctx.business,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: err.message }));
      throw err;
    }
  };

  const register = async (payload) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const { user } = await authApi.register(payload);
      const ctx = await businessApi.getMyBusiness();
      setState({
        user,
        profile: ctx.profile,
        employee: ctx.employee,
        business: ctx.business,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState((s) => ({ ...s, loading: false, error: err.message }));
      throw err;
    }
  };

  const logout = () => {
    authApi.logout();
    setState({
      user: null,
      profile: null,
      employee: null,
      business: null,
      loading: false,
      error: null,
    });
  };

  const refreshBusiness = async () => {
    try {
      const ctx = await businessApi.getMyBusiness();
      setState((s) => ({ ...s, profile: ctx.profile, employee: ctx.employee, business: ctx.business }));
    } catch { /* silent */ }
  };

  const setError = (error) => setState((s) => ({ ...s, error }));

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshBusiness, setError }}>
      {children}
    </AuthContext.Provider>
  );
}
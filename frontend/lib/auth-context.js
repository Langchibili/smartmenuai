// ─────────────────────────────────────────────────────────────────────────────
// FILE: smartmenuai/frontend/lib/auth-context.jsx
// ─────────────────────────────────────────────────────────────────────────────
"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { authApi, businessApi, getToken, clearToken } from "./api";
import { disconnectSocket, joinBusinessRoom, joinEmployeeRoom } from "./socket";

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
    let strapiUser;
    try {
      strapiUser = await authApi.me();
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
      return;
    }
    try {
      const ctx = await businessApi.getMyBusiness();
      setState({
        user: strapiUser,
        profile: ctx.profile,
        employee: ctx.employee,
        business: ctx.business,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState({
        user: strapiUser,
        profile: null,
        employee: null,
        business: null,
        loading: false,
        error: `Your account is signed in, but its profile could not be loaded: ${error.message}`,
      });
    }
  }, []);

  useEffect(() => { loadSession(); }, [loadSession]);

  useEffect(() => {
    const leaveBusiness = joinBusinessRoom(state.business?.id);
    const leaveEmployee = joinEmployeeRoom(state.user?.id);
    return () => {
      leaveBusiness();
      leaveEmployee();
    };
  }, [state.business?.id, state.user?.id]);

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
      return ctx;
    } catch (err) {
      const token = getToken();
      if (token) {
        try {
          const user = await authApi.me();
          setState({
            user,
            profile: null,
            employee: null,
            business: null,
            loading: false,
            error: `Signed in, but profile setup did not finish: ${err.message}`,
          });
        } catch {
          setState((s) => ({ ...s, loading: false, error: err.message }));
        }
      } else {
        setState((s) => ({ ...s, loading: false, error: err.message }));
      }
      throw err;
    }
  };

  const register = async (payload) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    let user = null;
    try {
      ({ user } = await authApi.register(payload));
      setState((s) => ({ ...s, user, loading: true }));
      const ctx = await businessApi.getMyBusiness({
        fullName: payload.fullName,
        accountType: payload.accountType,
      });
      setState({
        user,
        profile: ctx.profile,
        employee: ctx.employee,
        business: ctx.business,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        user: user ?? s.user,
        loading: false,
        error: user
          ? `Your account was created, but profile setup failed: ${err.message}`
          : err.message,
      }));
      throw err;
    }
  };

  const logout = () => {
    authApi.logout();
    disconnectSocket();
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
      return ctx;
    } catch (error) {
      setState((s) => ({ ...s, error: error.message }));
      throw error;
    }
  };

  const setError = (error) => setState((s) => ({ ...s, error }));

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, refreshBusiness, setError }}>
      {children}
    </AuthContext.Provider>
  );
}
import React from "react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, setToken } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    api("/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => {
        setToken("");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const data = await api("/auth/login", { method: "POST", body: { email, password } });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(name, email, password) {
    await api("/auth/register", { method: "POST", body: { name, email, password } });
    return login(email, password);
  }

  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setToken("");
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      isAuthenticated: Boolean(user),
      isAdmin: Boolean(user?.isAdmin),
      login,
      register,
      logout,
      setUser,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

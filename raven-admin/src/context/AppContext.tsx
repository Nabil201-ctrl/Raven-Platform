import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User } from '../types';
import { api } from '../services/api';
import { authStorage } from '../services/authStorage';

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  authChecking: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AppContext = createContext<AppState | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const clearSession = useCallback(() => {
    authStorage.clear();
    setUser(null);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const syncUser = useCallback(async () => {
    if (!authStorage.getToken()) {
      setUser(null);
      return;
    }

    const u = await api.getCurrentUser();
    if (u.role !== 'admin') {
      throw Object.assign(new Error('Access denied. Administrator credentials required.'), { status: 403 });
    }
    setUser(u);
    localStorage.setItem('raven_admin_cached_user', JSON.stringify(u));
  }, []);

  useEffect(() => {
    if (!authStorage.getToken()) {
      setAuthChecking(false);
      return;
    }
    syncUser()
      .catch(() => clearSession())
      .finally(() => setAuthChecking(false));
  }, [syncUser, clearSession]);

  const login = useCallback(async (email: string, password: string) => {
    const { user: u, token } = await api.login(email, password);
    if (u.role !== 'admin') {
      throw new Error('Access denied. This console is for administrators only.');
    }
    authStorage.setToken(token);
    setUser(u);
    localStorage.setItem('raven_admin_cached_user', JSON.stringify(u));
  }, []);

  return (
    <AppContext.Provider value={{
      user,
      isAuthenticated: authStorage.isLoggedIn() && user !== null,
      authChecking,
      login,
      logout,
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppState => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used inside AppProvider');
  return ctx;
};
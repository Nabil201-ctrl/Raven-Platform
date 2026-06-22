import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Transaction, RideHistoryEntry, User } from '../types';
import { api } from '../services/api';
import { authStorage } from '../services/authStorage';

export type Theme = 'dark' | 'light';

interface AppState {
  balance: number;
  transactions: Transaction[];
  addFunds: (amount: number) => void;
  deductFunds: (amount: number, description?: string) => Promise<void>;

  callMinutes: number;
  purchaseMinutes: (minutes: number) => Promise<void>;
  hasMinutes: boolean;
  useCallMinute: () => void;

  theme: Theme;
  toggleTheme: () => void;

  user: User | null;
  isAuthenticated: boolean;
  authChecking: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    avatar?: string,
    phoneNumber?: string,
    role?: string,
    campusId?: string,
    preferredRoute?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;

  syncState: () => Promise<void>;
  lastRide: RideHistoryEntry | null;
}

const AppContext = createContext<AppState | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [callMinutes, setCallMinutes] = useState<number>(0);
  const [theme, setTheme] = useState<Theme>('dark');
  const [user, setUser] = useState<User | null>(null);
  const [lastRide, setLastRide] = useState<RideHistoryEntry | null>(null);
  const [authChecking, setAuthChecking] = useState(true);

  const clearSession = useCallback(() => {
    authStorage.clear();
    setUser(null);
    setBalance(0);
    setTransactions([]);
    setCallMinutes(0);
    setLastRide(null);
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

  const syncState = useCallback(async () => {
    if (!authStorage.getToken()) {
      setUser(null);
      return;
    }

    try {
      const u = await api.getCurrentUser();
      setUser(u);
      setBalance(u.walletBalance);
      setCallMinutes(u.callMinutes);
      localStorage.setItem('raven_cached_user', JSON.stringify(u));

      const txs = await api.getTransactions();
      setTransactions(txs);
      localStorage.setItem('raven_cached_transactions', JSON.stringify(txs));

      const r = await api.getLastRide();
      setLastRide(r);
      if (r) {
        localStorage.setItem('raven_cached_last_ride', JSON.stringify(r));
      } else {
        localStorage.removeItem('raven_cached_last_ride');
      }
    } catch (e: any) {
      if (e?.status === 401) {
        clearSession();
        return;
      }
      throw e;
    }
  }, [clearSession]);

  useEffect(() => {
    if (!authStorage.getToken()) {
      setAuthChecking(false);
      return;
    }
    syncState()
      .catch(() => clearSession())
      .finally(() => setAuthChecking(false));
  }, [syncState, clearSession]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const addFunds = useCallback(async (amount: number) => {
    const res = await api.simulateDeposit(user?.id || '', amount);
    if (res.success) {
      await syncState();
    }
  }, [user, syncState]);

  const deductFunds = useCallback(async (amount: number, _description = 'Payment') => {
    await api.deductFromWallet(amount);
    await syncState();
  }, [syncState]);

  const purchaseMinutes = useCallback(async (minutes: number) => {
    await api.purchaseCallMinutes(minutes);
    await syncState();
  }, [syncState]);

  const useCallMinute = useCallback(async () => {
    await api.consumeCallMinute();
    await syncState();
  }, [syncState]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { user: u, token } = await api.login(email, password);
    authStorage.setToken(token);
    setUser(u);
    setBalance(u.walletBalance);
    setCallMinutes(u.callMinutes);
    localStorage.setItem('raven_cached_user', JSON.stringify(u));
    await syncState();
  }, [syncState]);

  const register = useCallback(async (
    name: string,
    email: string,
    password: string,
    avatar?: string,
    phoneNumber?: string,
    role?: string,
    campusId?: string,
    preferredRoute?: string,
  ) => {
    const { user: u, token } = await api.register(
      name, email, password, avatar, phoneNumber, role, campusId, preferredRoute,
    );
    authStorage.setToken(token);
    setUser(u);
    setBalance(u.walletBalance);
    setCallMinutes(u.callMinutes);
    localStorage.setItem('raven_cached_user', JSON.stringify(u));
    await syncState();
  }, [syncState]);

  return (
    <AppContext.Provider value={{
      balance, transactions, addFunds, deductFunds,
      callMinutes, purchaseMinutes, hasMinutes: callMinutes > 0, useCallMinute,
      theme, toggleTheme,
      user,
      isAuthenticated: authStorage.isLoggedIn() && user !== null,
      authChecking,
      login, register, logout,
      syncState, lastRide,
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
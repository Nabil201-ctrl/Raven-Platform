import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Transaction, RideHistoryEntry } from '../types';
import { api } from '../services/api';

export type Theme = 'dark' | 'light';

interface AppState {
  // Wallet
  balance: number;
  transactions: Transaction[];
  addFunds: (amount: number) => void;
  deductFunds: (amount: number, description?: string) => Promise<void>;

  // Calls
  callMinutes: number;
  purchaseMinutes: (minutes: number) => Promise<void>;
  hasMinutes: boolean;
  useCallMinute: () => void;

  // Theme
  theme: Theme;
  toggleTheme: () => void;

  // Auth / User
  user: { id: string; name: string; email: string; walletBalance: number; callMinutes: number } | null;

  // Unified dynamic sync method
  syncState: () => Promise<void>;
  lastRide: RideHistoryEntry | null;
}

const AppContext = createContext<AppState | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [balance, setBalance]         = useState<number>(2450);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [callMinutes, setCallMinutes] = useState<number>(12);
  const [theme, setTheme]             = useState<Theme>('dark');
  const [user, setUser]               = useState<AppState['user']>(null);
  const [lastRide, setLastRide]       = useState<RideHistoryEntry | null>(null);

  const syncState = useCallback(async () => {
    try {
      const u = await api.getCurrentUser();
      setUser(u);
      setBalance(u.walletBalance);
      setCallMinutes(u.callMinutes);

      const txs = await api.getTransactions();
      setTransactions(txs);

      const r = await api.getLastRide();
      setLastRide(r);
    } catch (e) {
      console.error('Error synchronizing backend state:', e);
    }
  }, []);

  // Load initial data once
  useEffect(() => {
    syncState();
  }, [syncState]);

  // Apply theme token to <html> so pages can query it if needed
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const addFunds = useCallback(async (amount: number) => {
    try {
      const res = await api.simulateDeposit(user?.id || 'usr_os1', amount);
      if (res.success) {
        await syncState();
      }
    } catch (e) {
      console.error('Error adding funds from backend:', e);
    }
  }, [user, syncState]);

  const deductFunds = useCallback(async (amount: number, description = 'Payment') => {
    try {
      console.log(`Deducting ${amount} from wallet for: ${description}`);
      await api.deductFromWallet(amount);
      await syncState();
    } catch (e) {
      console.error('Error deducting funds from backend:', e);
      throw e;
    }
  }, [syncState]);

  /* ── Calls ──────────────────────────────────────────── */
  const purchaseMinutes = useCallback(async (minutes: number) => {
    try {
      await api.purchaseCallMinutes(minutes);
      await syncState();
    } catch (e) {
      console.error('Error purchasing call minutes from backend:', e);
      throw e;
    }
  }, [syncState]);

  const useCallMinute = useCallback(async () => {
    try {
      await api.consumeCallMinute();
      await syncState();
    } catch (e) {
      console.error('Error consuming call minute from backend:', e);
    }
  }, [syncState]);

  /* ── Theme ──────────────────────────────────────────── */
  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <AppContext.Provider value={{
      balance, transactions, addFunds, deductFunds,
      callMinutes, purchaseMinutes, hasMinutes: callMinutes > 0, useCallMinute,
      theme, toggleTheme,
      user,
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
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Transaction, RideHistoryEntry, User, Driver } from '../types';
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
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;

  // Unified dynamic sync method
  syncState: () => Promise<void>;
  lastRide: RideHistoryEntry | null;
}

const AppContext = createContext<AppState | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [balance, setBalance]         = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [callMinutes, setCallMinutes] = useState<number>(0);
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
      console.error('Error synchronizing backend state, falling back to mock data:', e);
      // Fallback to mock data to populate the frontend
      const mockUser: User = {
        id: 'usr_mock1',
        name: 'Nabil Abubakar',
        email: 'nabil@example.com',
        walletBalance: 12500,
        callMinutes: 45,
        accountNumber: '1234567890',
        bankName: 'Raven Bank',
      };
      setUser(mockUser);
      setBalance(mockUser.walletBalance);
      setCallMinutes(mockUser.callMinutes);

      setTransactions([
        { id: 'tx_1', amount: 5000, type: 'credit', description: 'Wallet Top-up', createdAt: new Date().toISOString() },
        { id: 'tx_2', amount: 1500, type: 'debit', description: 'Shuttle Booking', createdAt: new Date(Date.now() - 86400000).toISOString() },
        { id: 'tx_3', amount: 300, type: 'debit', description: 'Keke Ride', createdAt: new Date(Date.now() - 172800000).toISOString() }
      ]);

      const mockDriver: Driver = {
        id: 'drv_1',
        name: 'Samuel O.',
        photo: 'https://i.pravatar.cc/150?u=drv_1',
        vehicleType: 'keke',
        vehiclePlate: 'ABJ-123-XY',
        systemCode: 'K-99',
        rating: 4.8,
        isActive: true,
        isFavorite: true,
      };

      setLastRide({
        id: 'ride_1',
        bookingId: 'bk_1',
        type: 'keke',
        driver: mockDriver,
        route: 'Main Gate to Hostel',
        date: new Date().toISOString(),
        price: 300,
        ticketId: 'tkt_1',
        canCall: true,
        canRate: true,
        isFavorited: true,
      });
    }
  }, []);

  // Load initial data once if logged in
  useEffect(() => {
    if (localStorage.getItem('raven_is_logged_in') === 'true') {
      syncState();
    }
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

  /* ── Auth ───────────────────────────────────────────── */
  const login = useCallback(async (email: string, password: string) => {
    try {
      const u = await api.login(email, password);
      localStorage.setItem('raven_is_logged_in', 'true');
      setUser(u);
      setBalance(u.walletBalance);
      setCallMinutes(u.callMinutes);
      await syncState();
    } catch (e) {
      console.error('Backend login failed, using showcase mock user');
      localStorage.setItem('raven_is_logged_in', 'true');
      await syncState();
    }
  }, [syncState]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const u = await api.register(name, email, password);
    localStorage.setItem('raven_is_logged_in', 'true');
    setUser(u);
    setBalance(u.walletBalance);
    setCallMinutes(u.callMinutes);
    await syncState();
  }, [syncState]);

  const logout = useCallback(() => {
    localStorage.removeItem('raven_is_logged_in');
    setUser(null);
    setBalance(0);
    setTransactions([]);
    setCallMinutes(0);
  }, []);

  return (
    <AppContext.Provider value={{
      balance, transactions, addFunds, deductFunds,
      callMinutes, purchaseMinutes, hasMinutes: callMinutes > 0, useCallMinute,
      theme, toggleTheme,
      user,
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
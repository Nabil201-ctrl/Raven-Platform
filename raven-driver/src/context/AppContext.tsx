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

const getInitialMockUser = (): User => ({
  id: 'usr_mock1',
  name: 'Nabil Abubakar',
  email: 'nabil@example.com',
  walletBalance: 12500,
  callMinutes: 45,
  accountNumber: '1234567890',
  bankName: 'Raven Bank',
});

const getMockDriver = (): Driver => ({
  id: 'drv_1',
  name: 'Samuel O.',
  photo: 'https://i.pravatar.cc/150?u=drv_1',
  vehicleType: 'keke' as const,
  vehiclePlate: 'ABJ-123-XY',
  systemCode: 'K-99',
  rating: 4.8,
  isActive: true,
  isFavorite: true,
});

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
    } catch (e) {
      console.warn('Error synchronizing backend state, falling back to cached/mock data:', e);
      
      const cachedUserStr = localStorage.getItem('raven_cached_user');
      const cachedTxsStr = localStorage.getItem('raven_cached_transactions');
      const cachedLastRideStr = localStorage.getItem('raven_cached_last_ride');

      let fallbackUser: User;
      if (cachedUserStr) {
        try {
          fallbackUser = JSON.parse(cachedUserStr);
        } catch {
          fallbackUser = getInitialMockUser();
        }
      } else {
        fallbackUser = getInitialMockUser();
      }

      setUser(fallbackUser);
      setBalance(fallbackUser.walletBalance);
      setCallMinutes(fallbackUser.callMinutes);

      if (cachedTxsStr) {
        try {
          setTransactions(JSON.parse(cachedTxsStr));
        } catch {
          setTransactions([
            { id: 'tx_1', amount: 5000, type: 'credit', description: 'Wallet Top-up', createdAt: new Date().toISOString() },
            { id: 'tx_2', amount: 1500, type: 'debit', description: 'Shuttle Booking', createdAt: new Date(Date.now() - 86400000).toISOString() },
            { id: 'tx_3', amount: 300, type: 'debit', description: 'Keke Ride', createdAt: new Date(Date.now() - 172800000).toISOString() }
          ]);
        }
      } else {
        setTransactions([
          { id: 'tx_1', amount: 5000, type: 'credit', description: 'Wallet Top-up', createdAt: new Date().toISOString() },
          { id: 'tx_2', amount: 1500, type: 'debit', description: 'Shuttle Booking', createdAt: new Date(Date.now() - 86400000).toISOString() },
          { id: 'tx_3', amount: 300, type: 'debit', description: 'Keke Ride', createdAt: new Date(Date.now() - 172800000).toISOString() }
        ]);
      }

      if (cachedLastRideStr) {
        try {
          setLastRide(JSON.parse(cachedLastRideStr));
        } catch {
          setLastRide({
            id: 'ride_1',
            bookingId: 'bk_1',
            type: 'keke',
            driver: getMockDriver(),
            route: 'Main Gate to Hostel',
            date: new Date().toISOString(),
            price: 300,
            ticketId: 'tkt_1',
            canCall: true,
            canRate: true,
            isFavorited: true,
          });
        }
      } else {
        setLastRide({
          id: 'ride_1',
          bookingId: 'bk_1',
          type: 'keke',
          driver: getMockDriver(),
          route: 'Main Gate to Hostel',
          date: new Date().toISOString(),
          price: 300,
          ticketId: 'tkt_1',
          canCall: true,
          canRate: true,
          isFavorited: true,
        });
      }
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
      console.warn('Error adding funds from backend, simulating locally (Showcase Fallback):', e);
      setBalance(prev => {
        const next = prev + amount;
        setUser(curr => {
          if (!curr) return null;
          const updated = { ...curr, walletBalance: next };
          localStorage.setItem('raven_cached_user', JSON.stringify(updated));
          return updated;
        });
        return next;
      });
      setTransactions(prev => {
        const nextTx = [
          {
            id: `t_mock_${Date.now()}`,
            amount,
            type: 'credit' as const,
            description: 'Wallet Top-up (Demo Fallback)',
            createdAt: new Date().toISOString(),
          },
          ...prev
        ];
        localStorage.setItem('raven_cached_transactions', JSON.stringify(nextTx));
        return nextTx;
      });
    }
  }, [user, syncState]);

  const deductFunds = useCallback(async (amount: number, description = 'Payment') => {
    try {
      console.log(`Deducting ${amount} from wallet for: ${description}`);
      await api.deductFromWallet(amount);
      await syncState();
    } catch (e) {
      console.warn('Error deducting funds from backend, simulating locally (Showcase Fallback):', e);
      setBalance(prev => {
        const next = Math.max(0, prev - amount);
        setUser(curr => {
          if (!curr) return null;
          const updated = { ...curr, walletBalance: next };
          localStorage.setItem('raven_cached_user', JSON.stringify(updated));
          return updated;
        });
        return next;
      });
      setTransactions(prev => {
        const nextTx = [
          {
            id: `t_mock_${Date.now()}`,
            amount,
            type: 'debit' as const,
            description: `${description} (Demo Fallback)`,
            createdAt: new Date().toISOString(),
          },
          ...prev
        ];
        localStorage.setItem('raven_cached_transactions', JSON.stringify(nextTx));
        return nextTx;
      });
    }
  }, [syncState]);

  /* ── Calls ──────────────────────────────────────────── */
  const purchaseMinutes = useCallback(async (minutes: number) => {
    try {
      await api.purchaseCallMinutes(minutes);
      await syncState();
    } catch (e) {
      console.warn('Error purchasing call minutes from backend, simulating locally (Showcase Fallback):', e);
      setCallMinutes(prev => {
        const next = prev + minutes;
        setUser(curr => {
          if (!curr) return null;
          const updated = { ...curr, callMinutes: next };
          localStorage.setItem('raven_cached_user', JSON.stringify(updated));
          return updated;
        });
        return next;
      });
      setBalance(prev => {
        const cost = minutes * 5;
        const next = Math.max(0, prev - cost);
        setUser(curr => {
          if (!curr) return null;
          const updated = { ...curr, walletBalance: next };
          localStorage.setItem('raven_cached_user', JSON.stringify(updated));
          return updated;
        });
        return next;
      });
      setTransactions(prev => {
        const nextTx = [
          {
            id: `t_mock_${Date.now()}`,
            amount: minutes * 5,
            type: 'debit' as const,
            description: `Purchased ${minutes} Call Mins (Demo Fallback)`,
            createdAt: new Date().toISOString(),
          },
          ...prev
        ];
        localStorage.setItem('raven_cached_transactions', JSON.stringify(nextTx));
        return nextTx;
      });
    }
  }, [syncState]);

  const useCallMinute = useCallback(async () => {
    try {
      await api.consumeCallMinute();
      await syncState();
    } catch (e) {
      console.warn('Error consuming call minute from backend, simulating locally (Showcase Fallback):', e);
      setCallMinutes(prev => {
        const next = Math.max(0, prev - 1);
        setUser(curr => {
          if (!curr) return null;
          const updated = { ...curr, callMinutes: next };
          localStorage.setItem('raven_cached_user', JSON.stringify(updated));
          return updated;
        });
        return next;
      });
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
      localStorage.setItem('raven_cached_user', JSON.stringify(u));
      await syncState();
    } catch (e) {
      console.warn('Backend login failed, using cached or initial mock user as fallback:', e);
      localStorage.setItem('raven_is_logged_in', 'true');
      
      const cachedUserStr = localStorage.getItem('raven_cached_user');
      let mockUser: User;
      if (cachedUserStr) {
        try {
          mockUser = JSON.parse(cachedUserStr);
        } catch {
          mockUser = getInitialMockUser();
        }
      } else {
        mockUser = getInitialMockUser();
      }
      setUser(mockUser);
      setBalance(mockUser.walletBalance);
      setCallMinutes(mockUser.callMinutes);
      localStorage.setItem('raven_cached_user', JSON.stringify(mockUser));
    }
  }, [syncState]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    try {
      const u = await api.register(name, email, password);
      localStorage.setItem('raven_is_logged_in', 'true');
      setUser(u);
      setBalance(u.walletBalance);
      setCallMinutes(u.callMinutes);
      localStorage.setItem('raven_cached_user', JSON.stringify(u));
      await syncState();
    } catch (e) {
      console.warn('Backend registration failed, using sandbox fallback mode:', e);
      localStorage.setItem('raven_is_logged_in', 'true');
      const mockUser: User = {
        id: `usr_mock_${Date.now()}`,
        name: name || 'Transit User',
        email: email || 'user@transit.app',
        walletBalance: 1000,
        callMinutes: 10,
        accountNumber: '9920193822',
        bankName: 'Wema Bank',
      };
      setUser(mockUser);
      setBalance(mockUser.walletBalance);
      setCallMinutes(mockUser.callMinutes);
      localStorage.setItem('raven_cached_user', JSON.stringify(mockUser));
    }
  }, [syncState]);

  const logout = useCallback(() => {
    localStorage.removeItem('raven_is_logged_in');
    localStorage.removeItem('raven_cached_user');
    localStorage.removeItem('raven_cached_transactions');
    localStorage.removeItem('raven_cached_last_ride');
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
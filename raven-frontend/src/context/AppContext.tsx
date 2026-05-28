import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { Transaction, RideHistoryEntry } from '../types';
import { api } from '../services/api';

export type Theme = 'dark' | 'light';

interface BookedSeat {
  shuttleId: string;
  seatNumbers: number[];
}

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

  // Booked seats — persisted so seats stay red after payment
  bookedSeats: BookedSeat[];
  addBookedSeats: (shuttleId: string, seats: number[]) => void;
  getBookedSeats: (shuttleId: string) => number[];

  // Pending / completed rides — shown on Profile and updates Last Ride
  pendingRides: RideHistoryEntry[];
  addPendingRide: (ride: RideHistoryEntry) => void;
  completeRide: (rideId: string) => void;
  lastRide: RideHistoryEntry | null;
}

const AppContext = createContext<AppState | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [balance, setBalance]         = useState<number>(2450);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [callMinutes, setCallMinutes] = useState<number>(12);
  const [theme, setTheme]             = useState<Theme>('dark');
  const [user, setUser]               = useState<AppState['user']>(null);
  const [bookedSeats, setBookedSeats] = useState<BookedSeat[]>([]);
  const [pendingRides, setPendingRides] = useState<RideHistoryEntry[]>([]);
  const [lastRide, setLastRide]       = useState<RideHistoryEntry | null>(null);

  // Load initial data once
  useEffect(() => {
    api.getCurrentUser().then(u => {
      setUser(u);
      setBalance(u.walletBalance);
      setCallMinutes(u.callMinutes);
    });
    api.getTransactions().then(setTransactions);
    // Seed last ride from API once; after that context owns it
    api.getLastRide().then(r => { if (r) setLastRide(r); });
  }, []);

  // Apply theme token to <html> so pages can query it if needed
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  /* ── Wallet ─────────────────────────────────────────── */
  const addFunds = useCallback((amount: number) => {
    setBalance(prev => prev + amount);
    setTransactions(prev => [{
      id: `tx_${Date.now()}`,
      type: 'credit',
      amount,
      description: 'Wallet Top-up',
      createdAt: new Date().toISOString(),
    }, ...prev]);
  }, []);

  const deductFunds = useCallback(async (amount: number, description = 'Payment') => {
    setBalance(prev => {
      if (prev < amount) throw new Error('Insufficient balance');
      return prev - amount;
    });
    setTransactions(prev => [{
      id: `tx_${Date.now()}`,
      type: 'debit',
      amount,
      description,
      createdAt: new Date().toISOString(),
    }, ...prev]);
    await api.deductFromWallet(amount);
  }, []);

  /* ── Calls ──────────────────────────────────────────── */
  const purchaseMinutes = useCallback(async (minutes: number) => {
    setCallMinutes(prev => prev + minutes);
    await api.purchaseCallMinutes(minutes);
  }, []);

  const useCallMinute = useCallback(() => {
    setCallMinutes(prev => Math.max(0, prev - 1));
  }, []);

  /* ── Theme ──────────────────────────────────────────── */
  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  /* ── Seats ──────────────────────────────────────────── */
  const addBookedSeats = useCallback((shuttleId: string, seats: number[]) => {
    setBookedSeats(prev => {
      const existing = prev.find(b => b.shuttleId === shuttleId);
      if (existing) {
        return prev.map(b =>
          b.shuttleId === shuttleId
            ? { ...b, seatNumbers: [...new Set([...b.seatNumbers, ...seats])] }
            : b
        );
      }
      return [...prev, { shuttleId, seatNumbers: seats }];
    });
  }, []);

  const getBookedSeats = useCallback((shuttleId: string): number[] => {
    return bookedSeats.find(b => b.shuttleId === shuttleId)?.seatNumbers ?? [];
  }, [bookedSeats]);

  /* ── Rides ──────────────────────────────────────────── */
  const addPendingRide = useCallback((ride: RideHistoryEntry) => {
    setPendingRides(prev => [ride, ...prev]);
    // Immediately becomes the latest "last ride"
    setLastRide(ride);
  }, []);

  const completeRide = useCallback((rideId: string) => {
    setPendingRides(prev => prev.filter(r => r.id !== rideId));
  }, []);

  return (
    <AppContext.Provider value={{
      balance, transactions, addFunds, deductFunds,
      callMinutes, purchaseMinutes, hasMinutes: callMinutes > 0, useCallMinute,
      theme, toggleTheme,
      user,
      bookedSeats, addBookedSeats, getBookedSeats,
      pendingRides, addPendingRide, completeRide, lastRide,
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
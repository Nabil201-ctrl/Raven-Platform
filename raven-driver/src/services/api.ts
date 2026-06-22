import type {
  User, Shuttle, Booking, Transaction, Driver, Complaint, RideHistoryEntry
} from '../types';

import { API_BASE } from '../config';

const BASE_URL = API_BASE;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const adminKey = localStorage.getItem('raven_admin_key') || '';
  const headers = {
    'Content-Type': 'application/json',
    ...(adminKey ? { 'x-admin-key': adminKey } : {}),
    ...(options?.headers || {}),
  };
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || response.statusText);
  }
  return response.json() as Promise<T>;
}

export const api = {
  /* ── Auth / User ───────────────────────────────────── */
  async login(email: string, password: string): Promise<User> {
    return request<User>('/user/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(name: string, email: string, password: string): Promise<User> {
    return request<User>('/user/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  },

  async getCurrentUser(): Promise<User> {
    return request<User>('/user');
  },

  async getWalletBalance(): Promise<number> {
    const res = await request<{ balance: number }>('/user/balance');
    return res.balance;
  },

  async getTransactions(): Promise<Transaction[]> {
    const res = await request<{ data: Transaction[] }>('/user/transactions');
    return res.data;
  },

  async deductFromWallet(amount: number): Promise<User> {
    return request<User>('/user/deduct', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },

  async addToWallet(amount: number): Promise<User> {
    return request<User>('/user/topup', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  },

  async getCallMinutes(): Promise<number> {
    const res = await request<{ minutes: number }>('/user/call-minutes');
    return res.minutes;
  },

  async purchaseCallMinutes(minutes: number): Promise<User> {
    return request<User>('/user/call-minutes/purchase', {
      method: 'POST',
      body: JSON.stringify({ minutes }),
    });
  },

  async consumeCallMinute(): Promise<User> {
    return request<User>('/user/call-minutes/consume', {
      method: 'POST',
    });
  },

  /* ── Shuttles ───────────────────────────────────────── */
  async getAvailableShuttles(): Promise<Shuttle[]> {
    return request<Shuttle[]>('/shuttles/available');
  },

  async getRecommendedShuttles(): Promise<Shuttle[]> {
    return request<Shuttle[]>('/shuttles/recommended');
  },

  async getShuttleDetails(id: string): Promise<Shuttle> {
    return request<Shuttle>(`/shuttles/${id}`);
  },

  /* ── Keke / Transit ─────────────────────────────────── */
  async verifyDriverCode(code: string): Promise<Driver> {
    return request<Driver>(`/drivers/verify/${code}`);
  },

  async getKekeDriverDetails(id: string): Promise<Driver> {
    return request<Driver>(`/drivers/${id}`);
  },

  async getLastRide(): Promise<RideHistoryEntry | null> {
    try {
      return await request<RideHistoryEntry>('/rides/last');
    } catch {
      return null;
    }
  },

  async getRideDetails(id: string): Promise<RideHistoryEntry> {
    return request<RideHistoryEntry>(`/rides/${id}`);
  },

  /* ── Bookings ───────────────────────────────────────── */
  async createBooking(data: {
    type: string; amount: number; driverId?: string;
    seats?: number[]; isPremium?: boolean;
    route?: string; shuttleId?: string; departureTime?: string;
  }): Promise<Booking> {
    return request<Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getDriverDetails(driverId: string): Promise<Driver> {
    return request<Driver>(`/drivers/${driverId}`);
  },

  async getDrivers(): Promise<Driver[]> {
    return request<Driver[]>('/drivers');
  },

  async registerDriver(data: { name: string; vehicleType: 'shuttle' | 'keke' | 'bike'; vehiclePlate: string }): Promise<Driver> {
    return request<Driver>('/drivers/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async verifyDriver(id: string): Promise<Driver> {
    return request<Driver>(`/drivers/${id}/verify`, {
      method: 'POST',
    });
  },

  async approveDriver(id: string): Promise<Driver> {
    return request<Driver>(`/drivers/${id}/approve`, {
      method: 'POST',
    });
  },

  /* ── Social / Interaction ───────────────────────────── */
  async toggleFavoriteDriver(driverId: string, isFavorite: boolean): Promise<void> {
    await request<void>(`/drivers/${driverId}/favorite`, {
      method: 'POST',
      body: JSON.stringify({ isFavorite }),
    });
  },

  async setDriverActive(driverId: string, isActive: boolean): Promise<Driver> {
    return request<Driver>(`/drivers/${driverId}/active`, {
      method: 'POST',
      body: JSON.stringify({ isActive }),
    });
  },

  async getTransitStatus(): Promise<import('../types/transit').TransitStatus> {
    return request<import('../types/transit').TransitStatus>('/transit/status');
  },

  async registerCarrier(
    driverId: string,
    data: { routeId: string; seatCapacity: number; notes?: string },
  ): Promise<Driver> {
    return request<Driver>(`/drivers/${driverId}/carrier`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async clearCarrier(driverId: string): Promise<Driver> {
    return request<Driver>(`/drivers/${driverId}/carrier`, {
      method: 'DELETE',
    });
  },

  async submitComplaint(complaint: Partial<Complaint>): Promise<void> {
    await request<void>('/complaints', {
      method: 'POST',
      body: JSON.stringify(complaint),
    });
  },

  async getComplaints(page = 1, limit = 20): Promise<{ data: Complaint[]; total: number }> {
    return request<{ data: Complaint[]; total: number }>(`/complaints?page=${page}&limit=${limit}`);
  },

  async resolveComplaint(id: string): Promise<void> {
    await request<void>(`/complaints/${id}/resolve`, {
      method: 'PATCH',
    });
  },

  async createShuttle(data: any): Promise<Shuttle> {
    return request<Shuttle>('/admin/shuttles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateShuttle(id: string, data: any): Promise<Shuttle> {
    return request<Shuttle>(`/admin/shuttles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteShuttle(id: string): Promise<void> {
    await request<void>(`/admin/shuttles/${id}`, {
      method: 'DELETE',
    });
  },

  async rateDriver(driverId: string, rating: number): Promise<void> {
    await request<void>(`/drivers/${driverId}/rate`, {
      method: 'POST',
      body: JSON.stringify({ rating }),
    });
  },

  async initiateMaskedCall(driverId: string): Promise<{ callSessionId: string; maxDurationSeconds: number; proxyPhone?: string }> {
    return request<{ callSessionId: string; maxDurationSeconds: number; proxyPhone?: string }>(`/drivers/${driverId}/call`, {
      method: 'POST',
    });
  },

  /* ── Monnify Sandbox Additions ──────────────────────── */
  async createMonnifyWallet(userId: string, name: string, email: string): Promise<any> {
    return request<any>('/wallet/create', {
      method: 'POST',
      body: JSON.stringify({ userId, name, email }),
    });
  },

  async pollMonnifyWallet(userId: string): Promise<any> {
    return request<any>(`/wallet/${userId}`);
  },

  async simulateDeposit(userId: string, amount: number): Promise<any> {
    return request<any>('/wallet/mock-deposit', {
      method: 'POST',
      body: JSON.stringify({ userId, amount }),
    });
  },

  async withdrawFunds(userId: string, amount: number, bankCode: string, accountNumber: string, narration: string): Promise<any> {
    return request<any>('/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify({ userId, amount, bankCode, accountNumber, narration }),
    });
  },

  async getReverseTrips(): Promise<any[]> {
    return request<any[]>('/transit/reverse-trips');
  },

  async resetShuttleSeats(code: string): Promise<any> {
    return request<any>('/transit/reset-seats', {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
  },

  async getVehicleDetailsByCode(code: string): Promise<any> {
    return request<any>(`/transit/vehicle/${code}`);
  },

  async getBooking(id: string): Promise<Booking> {
    return request<Booking>(`/bookings/${id}`);
  },
};
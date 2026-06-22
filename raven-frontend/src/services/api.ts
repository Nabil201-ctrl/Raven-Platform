import type {
  User, Shuttle, Booking, Transaction, Driver, Complaint, RideHistoryEntry, AuthResponse,
} from '../types';

import { API_BASE } from '../config';
import { authStorage } from './authStorage';

const BASE_URL = API_BASE;

function parseErrorMessage(errorText: string, status: number): string {
  try {
    const parsed = JSON.parse(errorText);
    if (parsed.message) {
      return Array.isArray(parsed.message) ? parsed.message.join(', ') : parsed.message;
    }
  } catch {
    // not JSON
  }
  if (status === 401) return 'Your session has expired. Please log in again.';
  return errorText || 'Request failed';
}

async function request<T>(path: string, options?: RequestInit & { skipAuth?: boolean }): Promise<T> {
  const adminKey = localStorage.getItem('raven_admin_key') || '';
  const token = authStorage.getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token && !options?.skipAuth ? { Authorization: `Bearer ${token}` } : {}),
    ...(adminKey ? { 'x-admin-key': adminKey } : {}),
    ...(options?.headers || {}),
  };
  const { skipAuth: _skipAuth, ...fetchOptions } = options || {};
  const response = await fetch(`${BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
  });
  if (!response.ok) {
    const errorText = await response.text();
    const err = new Error(parseErrorMessage(errorText, response.status));
    (err as any).status = response.status;
    throw err;
  }
  return response.json() as Promise<T>;
}

export const api = {
  /* ── Auth / User ───────────────────────────────────── */
  async login(email: string, password: string): Promise<AuthResponse> {
    return request<AuthResponse>('/user/login', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({ email, password }),
    });
  },

  async logout(): Promise<void> {
    try {
      await request<{ success: boolean }>('/user/logout', { method: 'POST' });
    } catch {
      // Clear local session even if server logout fails
    }
  },

  async register(
    name: string,
    email: string,
    password: string,
    avatar?: string,
    phoneNumber?: string,
    role?: string,
    campusId?: string,
    preferredRoute?: string,
  ): Promise<AuthResponse> {
    return request<AuthResponse>('/user/register', {
      method: 'POST',
      skipAuth: true,
      body: JSON.stringify({
        name,
        email,
        password,
        avatar,
        phoneNumber,
        role,
        campusId,
        preferredRoute,
      }),
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

  async getTransitStatus(): Promise<import('../types/transit').TransitStatus> {
    return request<import('../types/transit').TransitStatus>('/transit/status', { skipAuth: true });
  },

  async getCarriers(filters?: { routeId?: string; from?: string; to?: string }): Promise<Driver[]> {
    const params = new URLSearchParams();
    if (filters?.routeId) params.set('routeId', filters.routeId);
    if (filters?.from) params.set('from', filters.from);
    if (filters?.to) params.set('to', filters.to);
    const query = params.toString() ? `?${params.toString()}` : '';
    return request<Driver[]>(`/drivers/carriers${query}`, { skipAuth: true });
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

  /* ── Admin / Driver Management (used by AdminConsole & Driver flows) ── */
  async approveDriver(id: string): Promise<Driver> {
    return request<Driver>(`/drivers/${id}/approve`, { method: 'POST' });
  },

  async getRideHistory(page = 1, limit = 20): Promise<{ data: RideHistoryEntry[]; total: number }> {
    return request<{ data: RideHistoryEntry[]; total: number }>(`/rides?page=${page}&limit=${limit}`);
  },

  async toggleDriverActive(driverId: string, isActive: boolean): Promise<Driver> {
    // Reuse favorite endpoint as a proxy toggle for sandbox (or real active toggle if added later)
    return request<Driver>(`/drivers/${driverId}/favorite`, {
      method: 'POST',
      body: JSON.stringify({ isFavorite: isActive }),
    });
  },
};
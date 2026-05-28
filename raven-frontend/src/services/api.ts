import type {
  User, Shuttle, Booking, Transaction, Driver, Complaint, RideHistoryEntry
} from '../types';

const delay = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

export const api = {
  /* ── Auth / User ───────────────────────────────────── */
  async getCurrentUser(): Promise<User> {
    await delay(300);
    return {
      id: 'usr_os1',
      name: 'Oluwafemi Sheriff',
      email: 'femi@raven.app',
      walletBalance: 2450,
      callMinutes: 12,
      avatar: '',
    };
  },

  async getWalletBalance(): Promise<number> {
    await delay(150);
    return 2450;
  },

  async getTransactions(): Promise<Transaction[]> {
    await delay(200);
    return [
      { id: 't1', amount: 700, type: 'debit',  description: 'Shuttle — Giri → Gwagwalada', createdAt: new Date(Date.now() - 3600000).toISOString() },
      { id: 't2', amount: 150, type: 'debit',  description: 'Call Pack — 10 min',           createdAt: new Date(Date.now() - 7200000).toISOString() },
      { id: 't3', amount: 2000, type: 'credit', description: 'Wallet Top-up',               createdAt: new Date(Date.now() - 86400000).toISOString() },
      { id: 't4', amount: 200, type: 'debit',  description: 'Keke — Giri → Gwagwalada',     createdAt: new Date(Date.now() - 172800000).toISOString() },
    ];
  },

  async deductFromWallet(_amount: number): Promise<void> {
    await delay(300);
  },

  async addToWallet(_amount: number): Promise<void> {
    await delay(300);
  },

  async getCallMinutes(): Promise<number> {
    await delay(150);
    return 12;
  },

  async purchaseCallMinutes(_minutes: number): Promise<void> {
    await delay(400);
  },

  async consumeCallMinute(): Promise<void> {
    await delay(100);
  },

  /* ── Shuttles ───────────────────────────────────────── */
  async getAvailableShuttles(): Promise<Shuttle[]> {
    await delay(350);
    return [
      {
        id: 'sh_IE23', shuttleCode: 'Raven Shuttle-IE23',
        route: { from: 'Giri', to: 'Gwagwalada' },
        departureTime: '06:00', arrivalTime: '06:20',
        totalSeats: 19, availableSeats: 19, bookedSeats: [],
        pricePerSeat: 700, premiumPricePerSeat: 1000,
        status: 'available',
        driver: { id: 'd1', name: 'Musa Ibrahim', photo: '', vehicleType: 'shuttle', vehiclePlate: 'RVS-1234', systemCode: 'DRV001', rating: 4.8, isActive: true },
      },
      {
        id: 'sh_KQ07', shuttleCode: 'Raven Shuttle-KQ07',
        route: { from: 'Gwagwalada', to: 'Giri' },
        departureTime: '07:30', arrivalTime: '07:50',
        totalSeats: 14, availableSeats: 6, bookedSeats: [1,2,4,5,6,8,9,11],
        pricePerSeat: 700, premiumPricePerSeat: 1000,
        status: 'available',
        driver: { id: 'd2', name: 'Amina Bello', photo: '', vehicleType: 'shuttle', vehiclePlate: 'RVS-5678', systemCode: 'DRV002', rating: 4.6, isActive: true },
      },
      {
        id: 'sh_PL44', shuttleCode: 'Raven Shuttle-PL44',
        route: { from: 'Giri', to: 'Gwagwalada' },
        departureTime: '09:00', arrivalTime: '09:20',
        totalSeats: 19, availableSeats: 0, bookedSeats: Array.from({ length: 19 }, (_, i) => i + 1),
        pricePerSeat: 700, premiumPricePerSeat: 1000,
        status: 'full',
        driver: { id: 'd3', name: 'John Adeyemi', photo: '', vehicleType: 'shuttle', vehiclePlate: 'RVS-9012', systemCode: 'DRV003', rating: 4.9, isActive: true },
      },
    ];
  },

  async getRecommendedShuttles(): Promise<Shuttle[]> {
    await delay(300);
    return [
      {
        id: 'sh_RX11', shuttleCode: 'Raven Shuttle-RX11',
        route: { from: 'Giri', to: 'Gwagwalada' },
        departureTime: '08:45', arrivalTime: '09:05',
        totalSeats: 19, availableSeats: 17, bookedSeats: [3, 11],
        pricePerSeat: 700, premiumPricePerSeat: 1000,
        status: 'available',
        driver: { id: 'd4', name: 'Grace Okafor', photo: '', vehicleType: 'shuttle', vehiclePlate: 'RVS-3344', systemCode: 'DRV004', rating: 4.9, isActive: true },
      },
      {
        id: 'sh_MM02', shuttleCode: 'Raven Shuttle-MM02',
        route: { from: 'Gwagwalada', to: 'Giri' },
        departureTime: '10:00', arrivalTime: '10:20',
        totalSeats: 14, availableSeats: 11, bookedSeats: [2, 5, 9],
        pricePerSeat: 700, premiumPricePerSeat: 1000,
        status: 'available',
        driver: { id: 'd5', name: 'Ibrahim Yakubu', photo: '', vehicleType: 'shuttle', vehiclePlate: 'RVS-7788', systemCode: 'DRV005', rating: 4.7, isActive: false },
      },
    ];
  },

  async getShuttleDetails(id: string): Promise<Shuttle> {
    await delay(300);
    const all = await api.getAvailableShuttles();
    const found = all.find(s => s.id === id);
    if (found) return found;
    return {
      id, shuttleCode: `Raven Shuttle-${id.toUpperCase()}`,
      route: { from: 'Giri', to: 'Gwagwalada' },
      departureTime: '07:15', arrivalTime: '07:35',
      totalSeats: 19, availableSeats: 15, bookedSeats: [3, 7, 11, 14],
      pricePerSeat: 700, premiumPricePerSeat: 1000,
      status: 'available',
      driver: { id: 'd1', name: 'Musa Ibrahim', photo: '', vehicleType: 'shuttle', vehiclePlate: 'RVS-1234', systemCode: 'DRV001', rating: 4.8, isActive: true },
    };
  },

  /* ── Keke / Transit ─────────────────────────────────── */
  async verifyDriverCode(code: string): Promise<Driver> {
    await delay(500);
    if (!code || code.length < 4) throw new Error('Invalid code');
    return {
      id: `drv_${code.toLowerCase()}`,
      name: 'Aliyu Bello',
      photo: '',
      vehicleType: 'keke',
      vehiclePlate: `KJA-${code}`,
      systemCode: code.toUpperCase(),
      rating: 4.9,
      isActive: true,
    };
  },

  async getKekeDriverDetails(id: string): Promise<Driver> {
    await delay(300);
    return {
      id,
      name: 'Aliyu Bello',
      photo: '',
      vehicleType: 'keke',
      vehiclePlate: 'KJA-782BC',
      systemCode: 'KK782',
      rating: 4.9,
      isActive: true,
    };
  },

  async getLastRide(): Promise<RideHistoryEntry | null> {
    await delay(250);
    return {
      id: 'ride_last1',
      bookingId: 'book_123',
      type: 'keke',
      driver: {
        id: 'd_kk1',
        name: 'Aliyu Bello',
        photo: '',
        vehicleType: 'keke',
        vehiclePlate: 'KJA-782BC',
        systemCode: 'KK782',
        rating: 4.9,
        isActive: true,
        isFavorite: false,
      },
      route: 'Giri → Gwagwalada',
      date: 'Today, 5:15 PM',
      price: 200,
      ticketId: 'TKT-F4C00268',
      canCall: true,
      canRate: true,
      isFavorited: false,
    };
  },

  async getRideDetails(id: string): Promise<RideHistoryEntry> {
    await delay(200);
    return {
      id,
      bookingId: 'book_123',
      type: 'keke',
      driver: {
        id: 'd_kk1',
        name: 'Aliyu Bello',
        photo: '',
        vehicleType: 'keke',
        vehiclePlate: 'KJA-782BC',
        systemCode: 'KK782',
        rating: 4.9,
        isActive: true,
        isFavorite: false,
      },
      route: 'Giri → Gwagwalada',
      date: 'Today, 5:15 PM',
      price: 200,
      ticketId: 'TKT-F4C00268',
      canCall: true,
      canRate: true,
      isFavorited: false,
    };
  },

  /* ── Bookings ───────────────────────────────────────── */
  async createBooking(data: {
    type: string; amount: number; driverId?: string;
    seats?: number[]; isPremium?: boolean;
    route?: string; shuttleId?: string; departureTime?: string;
  }): Promise<Booking> {
    await delay(600);
    return {
      id: `book_${Date.now()}`,
      type: data.type as 'shuttle' | 'keke',
      route: data.route || 'Giri → Gwagwalada',
      driver: {
        id: data.driverId || 'd1',
        name: 'Musa Ibrahim',
        photo: '',
        vehicleType: 'shuttle',
        vehiclePlate: 'RVS-1234',
        systemCode: 'DRV001',
        rating: 4.8,
        isActive: true,
      },
      seats: data.seats,
      seatNumbers: data.seats,
      totalAmount: data.amount,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 3600000).toISOString(),
      ticketId: `TKT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
      qrCode: '',
      driverId: data.driverId,
      departureTime: data.departureTime,
    };
  },

  async getDriverDetails(driverId: string): Promise<Driver> {
    await delay(200);
    return {
      id: driverId,
      name: 'Musa Ibrahim',
      photo: '',
      vehicleType: 'shuttle',
      vehiclePlate: 'RVS-1234',
      systemCode: 'DRV001',
      rating: 4.8,
      isActive: true,
      isFavorite: false,
    };
  },

  /* ── Social / Interaction ───────────────────────────── */
  async toggleFavoriteDriver(_driverId: string, _isFavorite: boolean): Promise<void> {
    await delay(200);
  },

  async submitComplaint(_complaint: Partial<Complaint>): Promise<void> {
    await delay(300);
  },

  async rateDriver(_driverId: string, _rating: number): Promise<void> {
    await delay(200);
  },

  async initiateMaskedCall(_driverId: string): Promise<{ callSessionId: string; maxDurationSeconds: number }> {
    await delay(500);
    return { callSessionId: `call_${Date.now()}`, maxDurationSeconds: 180 };
  },
};
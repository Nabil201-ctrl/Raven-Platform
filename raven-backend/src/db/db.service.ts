import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { User, Driver, Shuttle, Booking, RideHistoryEntry, Transaction, Complaint, DailyTransitSession } from './types';

export interface WalletDetails {
  balance: number;
  accountNumber: string;
  bankName: string;
  accountReference: string;
  currency: string;
}

@Injectable()
export class DbService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('DbService'); 
  private readonly DB_FILE = path.join(__dirname, '..', '..', 'data', 'db.json');

  public currentUser: User = {
    id: '',
    name: '',
    email: '',
    walletBalance: 0,
    avatar: '',
    callMinutes: 0,
  };

  public walletDetails: WalletDetails = {
    balance: 0,
    accountNumber: '',
    bankName: '',
    accountReference: '',
    currency: 'NGN',
  };

  public drivers: Driver[] = [];

  public shuttles: Shuttle[] = [];

  public transactions: Transaction[] = [];

  public bookings: Booking[] = [];
  public complaints: Complaint[] = [];
  public reverseTrips: any[] = [];

  public lastRide: RideHistoryEntry | null = null;
  public rideHistory: RideHistoryEntry[] = [];
  public processedPayments = new Set<string>();

  // Multi-user support
  public users: (User & { passwordHash?: string })[] = [];
  public userWallets: Record<string, WalletDetails> = {};
  public userTransactions: Record<string, Transaction[]> = {};
  public sessions: Record<string, { userId: string; createdAt: string; expiresAt: string }> = {};
  public dailyTransitSession: DailyTransitSession | null = null;

  onModuleInit() {
    this.loadFromDisk();
  }

  onModuleDestroy() {
    this.logger.log('Graceful shutdown: flushing database to disk...');
    this.saveToDisk();
    this.logger.log('Database flushed successfully.');
  }

  public getDbFilePath() {
    return this.DB_FILE;
  }

  private ensureAdminUser() {
    const adminEmail = 'admin@raven.transit';
    const exists = this.users.some(u => u.email.toLowerCase() === adminEmail);
    if (exists) return;

    const adminUserId = 'usr_admin001';
    this.users.push({
      id: adminUserId,
      name: 'Raven Administrator',
      email: adminEmail,
      walletBalance: 0,
      callMinutes: 0,
      avatar: 'avatar_blue',
      phoneNumber: '+2348000000000',
      role: 'admin',
      passwordHash: 'admin123',
    });
    this.userWallets[adminUserId] = {
      balance: 0,
      accountNumber: '',
      bankName: '',
      accountReference: `REF-ADMIN-${adminUserId}`,
      currency: 'NGN',
    };
    this.userTransactions[adminUserId] = [];
    this.saveToDisk();
    console.log('[DB Seed] Provisioned default administrator account.');
  }

  private seedInitialData() {
    // Seed sample drivers (mix of shuttle + keke)
    this.drivers = [
      {
        id: 'drv_1001',
        name: 'Chinedu Okoro',
        photo: '',
        vehicleType: 'shuttle',
        vehiclePlate: 'ABJ-481K',
        vehicleModel: 'Toyota HiAce',
        systemCode: '1001',
        rating: 4.8,
        isActive: true,
        isVerified: true,
        isApproved: true,
        isFavorite: false,
      },
      {
        id: 'drv_2002',
        name: 'Amina Yusuf',
        photo: '',
        vehicleType: 'keke',
        vehiclePlate: 'KJA-2002',
        systemCode: '2002',
        rating: 4.6,
        isActive: true,
        isVerified: true,
        isApproved: true,
        isFavorite: true,
      },
      {
        id: 'drv_1003',
        name: 'Emeka Obi',
        photo: '',
        vehicleType: 'shuttle',
        vehiclePlate: 'ABJ-772X',
        vehicleModel: 'Toyota Coaster',
        systemCode: '1003',
        rating: 4.9,
        isActive: true,
        isVerified: true,
        isApproved: true,
        isFavorite: false,
      },
      {
        id: 'drv_3003',
        name: 'Bello Musa',
        photo: '',
        vehicleType: 'keke',
        vehiclePlate: 'KJA-3003',
        systemCode: '3003',
        rating: 4.3,
        isActive: true,
        isVerified: true,
        isApproved: true,
        isFavorite: false,
      },
      {
        id: 'drv_1005',
        name: 'Fatima Lawal',
        photo: '',
        vehicleType: 'shuttle',
        vehiclePlate: 'ABJ-991Y',
        vehicleModel: 'Ford Transit',
        systemCode: '1005',
        rating: 4.7,
        isActive: false,
        isVerified: true,
        isApproved: true,
        isFavorite: false,
      },
      {
        id: 'drv_4004',
        name: 'Ibrahim Sule',
        photo: '',
        vehicleType: 'bike',
        vehiclePlate: 'BIKE-404',
        systemCode: '4004',
        rating: 4.5,
        isActive: true,
        isVerified: true,
        isApproved: true,
        isFavorite: false,
      },
    ];

    // Seed shuttles (realistic schedules)
    this.shuttles = [
      {
        id: 'sh_1001',
        shuttleCode: '1001',
        route: { from: 'Giri', to: 'Gwagwalada' },
        departureTime: '07:30',
        arrivalTime: '08:05',
        totalSeats: 14,
        availableSeats: 11,
        bookedSeats: [2, 5, 9],
        pricePerSeat: 350,
        premiumPricePerSeat: 1800,
        status: 'available',
        driver: this.drivers[0],
      },
      {
        id: 'sh_1003',
        shuttleCode: '1003',
        route: { from: 'Gwagwalada', to: 'Giri' },
        departureTime: '08:15',
        arrivalTime: '08:50',
        totalSeats: 14,
        availableSeats: 14,
        bookedSeats: [],
        pricePerSeat: 350,
        premiumPricePerSeat: 1800,
        status: 'available',
        driver: this.drivers[2],
      },
      {
        id: 'sh_1005',
        shuttleCode: '1005',
        route: { from: 'Giri', to: 'Gwagwalada' },
        departureTime: '09:00',
        arrivalTime: '09:35',
        totalSeats: 14,
        availableSeats: 6,
        bookedSeats: [1,3,4,6,7,8,10,11,12,13,14],
        pricePerSeat: 400,
        premiumPricePerSeat: 1900,
        status: 'available',
        driver: this.drivers[4],
      },
      {
        id: 'sh_1007',
        shuttleCode: '1007',
        route: { from: 'Gwagwalada', to: 'Giri' },
        departureTime: '16:45',
        arrivalTime: '17:20',
        totalSeats: 14,
        availableSeats: 14,
        bookedSeats: [],
        pricePerSeat: 350,
        premiumPricePerSeat: 1750,
        status: 'available',
        driver: this.drivers[0],
      },
    ];

    // Seed demo users (student + administrator)
    const demoUserId = 'usr_demo001';
    const adminUserId = 'usr_admin001';
    this.users = [
      {
        id: demoUserId,
        name: 'Aisha Bello',
        email: 'aisha@student.unibuja.edu.ng',
        walletBalance: 24500,
        callMinutes: 18,
        avatar: 'avatar_emerald',
        phoneNumber: '+2348035551122',
        role: 'student',
        campusId: '22/SCI/487',
        preferredRoute: 'Giri ⇄ Main Campus',
        passwordHash: 'demo123', // sandbox only - plain for demo
      },
      {
        id: adminUserId,
        name: 'Raven Administrator',
        email: 'admin@raven.transit',
        walletBalance: 0,
        callMinutes: 0,
        avatar: 'avatar_blue',
        phoneNumber: '+2348000000000',
        role: 'admin',
        passwordHash: 'admin123', // sandbox only - plain for demo
      },
    ];

    this.currentUser = {
      id: demoUserId,
      name: 'Aisha Bello',
      email: 'aisha@student.unibuja.edu.ng',
      walletBalance: 24500,
      callMinutes: 18,
      avatar: 'avatar_emerald',
      phoneNumber: '+2348035551122',
      role: 'student',
      campusId: '22/SCI/487',
      preferredRoute: 'Giri ⇄ Main Campus',
    };

    this.walletDetails = {
      balance: 24500,
      accountNumber: '8820193847',
      bankName: 'Wema Bank (Sandbox)',
      accountReference: 'REF-SIM-usr_demo001',
      currency: 'NGN',
    };

    this.transactions = [
      { id: 't_seed1', amount: 15000, type: 'credit', description: 'Welcome Bonus Top-up', createdAt: new Date(Date.now() - 1000 * 3600 * 26).toISOString() },
      { id: 't_seed2', amount: 350, type: 'debit', description: 'Shuttle 1001 — Giri → Gwagwalada (Seat 3)', createdAt: new Date(Date.now() - 1000 * 3600 * 5).toISOString() },
    ];

    this.userWallets[demoUserId] = { ...this.walletDetails };
    this.userTransactions[demoUserId] = [...this.transactions];
    this.userWallets[adminUserId] = {
      balance: 0,
      accountNumber: '',
      bankName: '',
      accountReference: `REF-ADMIN-${adminUserId}`,
      currency: 'NGN',
    };
    this.userTransactions[adminUserId] = [];

    // Sample ride history + last ride
    this.rideHistory = [
      {
        id: 'book_seed_hist',
        bookingId: 'book_seed_hist',
        type: 'shuttle',
        driver: this.drivers[0],
        route: 'Giri → Gwagwalada',
        date: 'Yesterday',
        price: 700,
        ticketId: 'TKT-SEED01',
        canCall: true,
        canRate: true,
        isFavorited: false,
      },
    ];
    this.lastRide = this.rideHistory[0];

    // Sample complaint for admin demo
    this.complaints = [
      {
        id: 'c_seed01',
        bookingId: 'book_seed_hist',
        driverId: this.drivers[0].id,
        message: 'Driver took a slightly longer route today. Otherwise fine.',
        status: 'pending',
        createdAt: new Date(Date.now() - 1000 * 3600 * 3).toISOString(),
      },
    ];

    console.log('[DB Seed] Seeded 6 drivers, 4 shuttles, demo user, transactions, and sample history.');
  }

  public saveToDisk() {
    try {
      // Automatically synchronize current user's state back into multi-user storage
      if (this.currentUser && this.currentUser.id) {
        const uId = this.currentUser.id;
        const userIdx = this.users.findIndex(u => u.id === uId);
        if (userIdx !== -1) {
          this.users[userIdx] = {
            ...this.users[userIdx],
            ...this.currentUser,
            walletBalance: this.walletDetails.balance,
          };
        }
        this.userWallets[uId] = { ...this.walletDetails };
        this.userTransactions[uId] = [...this.transactions];
      }

      const data = {
        currentUser: this.currentUser,
        walletDetails: this.walletDetails,
        drivers: this.drivers,
        shuttles: this.shuttles,
        transactions: this.transactions,
        bookings: this.bookings,
        complaints: this.complaints,
        reverseTrips: this.reverseTrips,
        rideHistory: this.rideHistory,
        lastRide: this.lastRide,
        processedPayments: Array.from(this.processedPayments),
        users: this.users,
        userWallets: this.userWallets,
        userTransactions: this.userTransactions,
        sessions: this.sessions,
        dailyTransitSession: this.dailyTransitSession,
      };
      const dir = path.dirname(this.DB_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e: any) {
      console.error('[DB Persistence Error] Failed to write database to disk:', e.message);
    }
  }

  private loadFromDisk() {
    try {
      if (fs.existsSync(this.DB_FILE)) {
        const raw = fs.readFileSync(this.DB_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (data.currentUser) this.currentUser = data.currentUser;
        if (data.walletDetails) this.walletDetails = data.walletDetails;
        if (data.drivers) this.drivers = data.drivers;
        if (data.shuttles) this.shuttles = data.shuttles;
        if (data.transactions) this.transactions = data.transactions;
        if (data.bookings) this.bookings = data.bookings;
        if (data.complaints) this.complaints = data.complaints;
        if (data.reverseTrips) this.reverseTrips = data.reverseTrips;
        if (data.rideHistory) this.rideHistory = data.rideHistory;
        if (data.lastRide) this.lastRide = data.lastRide;
        if (data.processedPayments) this.processedPayments = new Set(data.processedPayments);
        
        this.users = data.users || [];
        this.userWallets = data.userWallets || {};
        this.userTransactions = data.userTransactions || {};
        this.sessions = data.sessions || {};
        this.dailyTransitSession = data.dailyTransitSession || null;

        console.log('[DB Persistence] Loaded persistent JSON database successfully');

        // If loaded file is empty of core entities (fresh or wiped), auto-seed demo data
        if (this.drivers.length === 0 || this.shuttles.length === 0) {
          console.log('[DB Persistence] Core data missing after load — auto-seeding demo fleet...');
          this.seedInitialData();
        } else {
          this.ensureAdminUser();
        }
      } else {
        console.log('[DB Persistence] No database found. Seeding initial data...');
        this.seedInitialData();
        this.saveToDisk();
      }
    } catch (e: any) {
      console.warn('[DB Persistence Error] Failed to load from disk, using default memory seed:', e.message);
    }
  }
}

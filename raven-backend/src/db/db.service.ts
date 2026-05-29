import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { User, Driver, Shuttle, Booking, RideHistoryEntry, Transaction, Complaint } from './types';

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
    id: 'usr_os1',
    name: 'Oluwafemi Sheriff',
    email: 'femi@raven.app',
    walletBalance: 15000,
    avatar: '',
    callMinutes: 10,
  };

  public walletDetails: WalletDetails = {
    balance: 15000,
    accountNumber: '8823490123',
    bankName: 'Wema Bank (Simulated Sandbox)',
    accountReference: `REF-SIM-usr_os1-${Date.now()}`,
    currency: 'NGN',
  };

  public drivers: Driver[] = [
    { id: 'd1', name: 'Mustapha Yusuf', photo: '', vehicleType: 'shuttle', vehiclePlate: 'ABJ-123-XY', systemCode: '1001', rating: 4.8, isActive: true, isFavorite: false },
    { id: 'd2', name: 'Amina Bello', photo: '', vehicleType: 'shuttle', vehiclePlate: 'RVS-5678', systemCode: 'DRV002', rating: 4.6, isActive: true, isFavorite: false },
    { id: 'd3', name: 'John Adeyemi', photo: '', vehicleType: 'shuttle', vehiclePlate: 'RVS-9012', systemCode: 'DRV003', rating: 4.9, isActive: true, isFavorite: false },
    { id: 'd4', name: 'Grace Okafor', photo: '', vehicleType: 'shuttle', vehiclePlate: 'RVS-3344', systemCode: 'DRV004', rating: 4.9, isActive: true, isFavorite: false },
    { id: 'd5', name: 'Ibrahim Yakubu', photo: '', vehicleType: 'shuttle', vehiclePlate: 'RVS-7788', systemCode: 'DRV005', rating: 4.7, isActive: false, isFavorite: false },
    { id: 'd_kk1', name: 'Ibrahim Bello', photo: '', vehicleType: 'keke', vehiclePlate: 'KDS-789-QA', systemCode: '2002', rating: 4.9, isActive: true, isFavorite: false },
  ];

  public shuttles: Shuttle[] = [
    {
      id: 'sh_1001',
      shuttleCode: '1001',
      route: { from: 'Giri', to: 'Gwagwalada' },
      departureTime: '06:00',
      arrivalTime: '06:20',
      totalSeats: 14,
      availableSeats: 10,
      bookedSeats: [1, 3, 9, 14],
      pricePerSeat: 500,
      premiumPricePerSeat: 800,
      status: 'available',
      driver: this.drivers[0],
    },
    {
      id: 'sh_IE23',
      shuttleCode: 'Raven Shuttle-IE23',
      route: { from: 'Giri', to: 'Gwagwalada' },
      departureTime: '06:00',
      arrivalTime: '06:20',
      totalSeats: 19,
      availableSeats: 19,
      bookedSeats: [],
      pricePerSeat: 700,
      premiumPricePerSeat: 1000,
      status: 'available',
      driver: this.drivers[0],
    },
    {
      id: 'sh_KQ07',
      shuttleCode: 'Raven Shuttle-KQ07',
      route: { from: 'Gwagwalada', to: 'Giri' },
      departureTime: '07:30',
      arrivalTime: '07:50',
      totalSeats: 14,
      availableSeats: 6,
      bookedSeats: [1, 2, 4, 5, 6, 8, 9, 11],
      pricePerSeat: 700,
      premiumPricePerSeat: 1000,
      status: 'available',
      driver: this.drivers[1],
    },
  ];

  public transactions: Transaction[] = [
    { id: 't1', amount: 500, type: 'debit', description: 'Shuttle — Giri ⇄ Gwagwalada', createdAt: new Date(Date.now() - 3600000).toISOString() },
    { id: 't2', amount: 150, type: 'debit', description: 'Call Pack — 10 min', createdAt: new Date(Date.now() - 7200000).toISOString() },
    { id: 't3', amount: 15000, type: 'credit', description: 'Monnify Sandbox Preload', createdAt: new Date(Date.now() - 86400000).toISOString() },
  ];

  public bookings: Booking[] = [];
  public complaints: Complaint[] = [];
  public reverseTrips: any[] = [];

  public lastRide: RideHistoryEntry | null = {
    id: 'ride_last1',
    bookingId: 'book_123',
    type: 'keke',
    driver: this.drivers[5],
    route: 'Gate 1 ⇄ Faculty of Engineering',
    date: 'Today, 5:15 PM',
    price: 300,
    ticketId: 'TKT-F4C00268',
    canCall: true,
    canRate: true,
    isFavorited: false,
  };

  public rideHistory: RideHistoryEntry[] = [this.lastRide as RideHistoryEntry];
  public processedPayments = new Set<string>();

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

  public saveToDisk() {
    try {
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
        console.log('[DB Persistence] Loaded persistent JSON database successfully');
      } else {
        console.log('[DB Persistence] No database found. Seeding initial data...');
        this.saveToDisk();
      }
    } catch (e: any) {
      console.warn('[DB Persistence Error] Failed to load from disk, using default memory seed:', e.message);
    }
  }
}

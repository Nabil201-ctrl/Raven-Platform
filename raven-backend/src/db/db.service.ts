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
        
        // Load or seed multi-user details
        this.users = data.users || [
          {
            id: 'usr_os1',
            name: 'Oluwafemi Sheriff',
            email: 'femi@raven.app',
            walletBalance: 15000,
            avatar: '',
            callMinutes: 10,
            passwordHash: 'password123',
          }
        ];
        this.userWallets = data.userWallets || {
          'usr_os1': { ...this.walletDetails }
        };
        this.userTransactions = data.userTransactions || {
          'usr_os1': [...this.transactions]
        };
        
        console.log('[DB Persistence] Loaded persistent JSON database successfully');
      } else {
        console.log('[DB Persistence] No database found. Seeding initial data...');
        // Seed default multi-user variables
        this.users = [
          {
            id: 'usr_os1',
            name: 'Oluwafemi Sheriff',
            email: 'femi@raven.app',
            walletBalance: 15000,
            avatar: '',
            callMinutes: 10,
            passwordHash: 'password123',
          }
        ];
        this.userWallets = {
          'usr_os1': { ...this.walletDetails }
        };
        this.userTransactions = {
          'usr_os1': []
        };
        this.saveToDisk();
      }
    } catch (e: any) {
      console.warn('[DB Persistence Error] Failed to load from disk, using default memory seed:', e.message);
    }
  }
}

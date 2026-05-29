import { Injectable, BadRequestException } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { User, Transaction } from '../db/types';

@Injectable()
export class UserService {
  constructor(private readonly db: DbService) {}

  getCurrentUser(): User {
    this.db.currentUser.walletBalance = this.db.walletDetails.balance;
    return this.db.currentUser;
  }

  getWalletBalance(): number {
    return this.db.walletDetails.balance;
  }

  getTransactions(page = 1, limit = 20): { data: Transaction[]; total: number; page: number; limit: number; totalPages: number } {
    const total = this.db.transactions.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const data = this.db.transactions.slice(start, start + limit);
    return { data, total, page, limit, totalPages };
  }

  deductFromWallet(amount: number): User {
    if (this.db.walletDetails.balance < amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }
    this.db.walletDetails.balance -= amount;
    this.db.currentUser.walletBalance = this.db.walletDetails.balance;
    this.db.transactions.unshift({
      id: `t_${Date.now()}`,
      amount,
      type: 'debit',
      description: 'Deducted from wallet',
      createdAt: new Date().toISOString(),
    });
    this.db.saveToDisk();
    return this.db.currentUser;
  }

  addToWallet(amount: number): User {
    this.db.walletDetails.balance += amount;
    this.db.currentUser.walletBalance = this.db.walletDetails.balance;
    this.db.transactions.unshift({
      id: `t_${Date.now()}`,
      amount,
      type: 'credit',
      description: 'Wallet Top-up',
      createdAt: new Date().toISOString(),
    });
    this.db.saveToDisk();
    return this.db.currentUser;
  }

  getCallMinutes(): number {
    return this.db.currentUser.callMinutes;
  }

  purchaseCallMinutes(minutes: number): User {
    const pricePerMin = 15; // standard rate
    const totalPrice = minutes * pricePerMin;
    if (this.db.walletDetails.balance < totalPrice) {
      throw new BadRequestException('Insufficient wallet balance to buy call minutes');
    }
    this.db.walletDetails.balance -= totalPrice;
    this.db.currentUser.walletBalance = this.db.walletDetails.balance;
    this.db.currentUser.callMinutes += minutes;

    this.db.transactions.unshift({
      id: `t_${Date.now()}`,
      amount: totalPrice,
      type: 'debit',
      description: `Call Pack — ${minutes} min`,
      createdAt: new Date().toISOString(),
    });
    this.db.saveToDisk();

    return this.db.currentUser;
  }

  consumeCallMinute(): User {
    if (this.db.currentUser.callMinutes <= 0) {
      throw new BadRequestException('No call minutes left');
    }
    this.db.currentUser.callMinutes -= 1;
    this.db.saveToDisk();
    return this.db.currentUser;
  }
}

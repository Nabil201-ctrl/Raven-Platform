import { Injectable, BadRequestException } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { User, Transaction } from '../db/types';
import axios from 'axios';

@Injectable()
export class UserService {
  constructor(private readonly db: DbService) {}

  getCurrentUser(): User {
    this.db.currentUser.walletBalance = this.db.walletDetails.balance;
    return {
      ...this.db.currentUser,
      accountNumber: this.db.walletDetails.accountNumber,
      bankName: this.db.walletDetails.bankName,
    };
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

  login(email: string, passwordHash: string): User {
    const user = this.db.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user || user.passwordHash !== passwordHash) {
      throw new BadRequestException('Invalid email or password');
    }
    
    // Switch current user state in DB
    this.db.currentUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || '',
      walletBalance: user.walletBalance,
      callMinutes: user.callMinutes,
    };
    this.db.walletDetails = this.db.userWallets[user.id] || {
      balance: user.walletBalance,
      accountNumber: `88${Math.floor(10000000 + Math.random() * 90000000)}`,
      bankName: 'Wema Bank (Simulated Sandbox)',
      accountReference: `REF-SIM-${user.id}-${Date.now()}`,
      currency: 'NGN',
    };
    this.db.transactions = this.db.userTransactions[user.id] || [];
    this.db.saveToDisk();
    
    return {
      ...this.db.currentUser,
      accountNumber: this.db.walletDetails.accountNumber,
      bankName: this.db.walletDetails.bankName,
    };
  }

  async register(name: string, email: string, passwordHash: string): Promise<User> {
    const exists = this.db.users.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      throw new BadRequestException('User with this email already exists');
    }
    
    const userId = `usr_${Date.now()}`;
    const newUser: User & { passwordHash?: string } = {
      id: userId,
      name,
      email,
      walletBalance: 15000,
      callMinutes: 10,
      avatar: '',
      passwordHash,
    };
    
    this.db.users.push(newUser);
    
    const simulatedAccount = {
      balance: 15000,
      accountNumber: `88${Math.floor(10000000 + Math.random() * 90000000)}`,
      bankName: 'Wema Bank (Simulated Sandbox)',
      accountReference: `REF-SIM-${userId}-${Date.now()}`,
      currency: 'NGN',
    };

    try {
      const apiKey = (process.env.APIKEY || '').trim();
      const secretKey = (process.env.Secret_Key || '').trim();
      const contractCode = (process.env.Contract_Code || '').trim();

      if (apiKey && secretKey && contractCode) {
        const auth = Buffer.from(`${apiKey}:${secretKey}`).toString('base64');
        const tokenRes = await axios.post('https://sandbox.monnify.com/api/v1/auth/login', {}, {
          headers: { Authorization: `Basic ${auth}` },
        });
        const token = tokenRes.data.responseBody.accessToken;
        const accountReference = `REF-${userId}-${Date.now()}`;

        const monnifyRes = await axios.post('https://sandbox.monnify.com/api/v2/bank-transfer/reserved-accounts', {
          accountReference: accountReference,
          accountName: name,
          currencyCode: "NGN",
          contractCode: contractCode,
          customerEmail: email,
          customerName: name,
          getAllAvailableBanks: false,
          preferredBanks: ["035"]
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const accountData = monnifyRes.data.responseBody.accounts[0];
        simulatedAccount.accountNumber = accountData.accountNumber;
        simulatedAccount.bankName = accountData.bankName;
        simulatedAccount.accountReference = accountReference;
        console.log(`[Monnify Registration Sandbox] Virtual Reserved Account Successfully Setup: ${accountData.accountNumber} (${accountData.bankName})`);
      }
    } catch (e: any) {
      console.warn('[Monnify Registration Sandbox Fallback] Creating simulated account for registration:', e.message);
    }

    this.db.userWallets[userId] = simulatedAccount;
    
    this.db.userTransactions[userId] = [
      {
        id: `t_${Date.now()}`,
        amount: 15000,
        type: 'credit',
        description: 'Welcome Bonus Top-up',
        createdAt: new Date().toISOString(),
      }
    ];
    
    this.db.currentUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      walletBalance: newUser.walletBalance,
      callMinutes: newUser.callMinutes,
      avatar: newUser.avatar,
    };
    this.db.walletDetails = this.db.userWallets[userId];
    this.db.transactions = this.db.userTransactions[userId];
    
    this.db.saveToDisk();
    return {
      ...this.db.currentUser,
      accountNumber: this.db.walletDetails.accountNumber,
      bankName: this.db.walletDetails.bankName,
    };
  }
}

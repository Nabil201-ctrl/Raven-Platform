import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { DbService } from '../db/db.service';
import { User } from '../db/types';

export interface AuthResult {
  user: User & { accountNumber?: string; bankName?: string };
  token: string;
}

@Injectable()
export class AuthService {
  private readonly SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  constructor(private readonly db: DbService) {}

  hashPassword(password: string): string {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
  }

  verifyPassword(password: string, stored?: string): boolean {
    if (!stored) return false;
    if (!stored.includes(':')) {
      return stored === password;
    }
    const [salt, hash] = stored.split(':');
    const derived = scryptSync(password, salt, 64).toString('hex');
    try {
      return timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(derived, 'hex'));
    } catch {
      return false;
    }
  }

  createSession(userId: string): string {
    const token = randomBytes(32).toString('hex');
    const now = Date.now();
    this.db.sessions[token] = {
      userId,
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + this.SESSION_TTL_MS).toISOString(),
    };
    this.db.saveToDisk();
    return token;
  }

  validateSession(token: string): string | null {
    const session = this.db.sessions[token];
    if (!session) return null;
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      delete this.db.sessions[token];
      this.db.saveToDisk();
      return null;
    }
    return session.userId;
  }

  revokeSession(token: string): void {
    if (this.db.sessions[token]) {
      delete this.db.sessions[token];
      this.db.saveToDisk();
    }
  }

  activateUser(userId: string): User {
    const user = this.db.users.find(u => u.id === userId);
    if (!user) {
      throw new UnauthorizedException('User account not found');
    }

    const wallet = this.db.userWallets[userId] || {
      balance: user.walletBalance,
      accountNumber: '',
      bankName: '',
      accountReference: `REF-${userId}`,
      currency: 'NGN',
    };

    this.db.currentUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar || '',
      walletBalance: wallet.balance,
      callMinutes: user.callMinutes,
      phoneNumber: user.phoneNumber,
      role: user.role,
      campusId: user.campusId,
      preferredRoute: user.preferredRoute,
    };
    this.db.walletDetails = { ...wallet };
    this.db.transactions = [...(this.db.userTransactions[userId] || [])];

    return {
      ...this.db.currentUser,
      accountNumber: wallet.accountNumber,
      bankName: wallet.bankName,
    };
  }

  buildAuthResult(userId: string): AuthResult {
    const user = this.activateUser(userId);
    const token = this.createSession(userId);
    return { user, token };
  }
}
import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DbService } from '../db/db.service';
import { Shuttle, Driver } from '../db/types';

@Injectable()
export class ShuttleService {
  private readonly logger = new Logger('ShuttleService');

  constructor(private readonly db: DbService) {}

  getAvailableShuttles(): Shuttle[] {
    return this.db.shuttles.filter(s => s.status !== 'departed');
  }

  getRecommendedShuttles(): Shuttle[] {
    return this.db.shuttles.filter(s => s.status === 'available' && s.availableSeats > 0).slice(0, 2);
  }

  getShuttleDetails(id: string): Shuttle {
    const found = this.db.shuttles.find(s => s.id === id || s.shuttleCode === id);
    if (!found) {
      throw new NotFoundException(`Shuttle with ID/Code "${id}" not found`);
    }
    return found;
  }

  getVehicleDetailsByCode(code: string): any {
    const upper = code.toUpperCase();
    const driver = this.db.drivers.find(d => d.systemCode === upper);
    
    // Dynamic fallback if driver not found
    let targetDriver: Driver;
    if (!driver) {
      targetDriver = {
        id: `drv_${code.toLowerCase()}`,
        name: 'Aliyu Bello',
        photo: '',
        vehicleType: 'keke',
        vehiclePlate: `KJA-${upper}`,
        systemCode: upper,
        rating: 4.9,
        isActive: true,
        isFavorite: false,
      };
      this.db.drivers.push(targetDriver);
      this.db.saveToDisk();
    } else {
      targetDriver = driver;
    }

    if (targetDriver.vehicleType === 'shuttle') {
      try {
        return this.getShuttleDetails(code);
      } catch {
        return targetDriver;
      }
    }
    return targetDriver;
  }

  /* ── Reverse Trips ─────────────────────────────────────── */

  getReverseTrips() {
    return this.db.reverseTrips.slice(0, 10);
  }

  arriveReverseTrip(id: string) {
    const trip = this.db.reverseTrips.find(t => t.id === id);
    if (!trip) {
      throw new NotFoundException(`Reverse trip "${id}" not found`);
    }
    trip.status = 'ARRIVED';
    trip.arrivedAt = new Date().toISOString();
    this.db.saveToDisk();
    this.logger.log(`Reverse trip ${id} marked as ARRIVED.`);
    return trip;
  }

  /** Auto-transition INBOUND reverse trips to ARRIVED after their estimated ETA */
  @Cron(CronExpression.EVERY_MINUTE)
  handleReverseTripArrival() {
    const now = new Date();
    let transitioned = 0;

    for (const trip of this.db.reverseTrips) {
      if (trip.status === 'INBOUND') {
        const eta = trip.estimatedArrivalAt ? new Date(trip.estimatedArrivalAt) : null;
        // If ETA has passed, or the trip is older than 10 minutes, mark as arrived
        const createdAt = new Date(trip.createdAt);
        const ageMs = now.getTime() - createdAt.getTime();
        if ((eta && eta < now) || ageMs > 10 * 60 * 1000) {
          trip.status = 'ARRIVED';
          trip.arrivedAt = now.toISOString();
          transitioned++;
        }
      }
    }

    // Cleanup: remove resolved trips older than 1 hour
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const before = this.db.reverseTrips.length;
    this.db.reverseTrips = this.db.reverseTrips.filter(t => {
      if (t.status === 'ARRIVED' && new Date(t.arrivedAt || t.createdAt) < oneHourAgo) {
        return false;
      }
      return true;
    });
    const purged = before - this.db.reverseTrips.length;

    if (transitioned > 0 || purged > 0) {
      this.db.saveToDisk();
      if (transitioned > 0) this.logger.log(`[Cron] Auto-arrived ${transitioned} reverse trip(s).`);
      if (purged > 0) this.logger.log(`[Cron] Purged ${purged} stale reverse trip(s).`);
    }
  }

  /* ── Admin Operations ──────────────────────────────────── */

  resetSeats(code: string) {
    const s = this.db.shuttles.find(sh => sh.shuttleCode === code || sh.id === code);
    if (s) {
      // Book 13 out of 14 seats so the next single booking triggers the reverse trip alert
      s.bookedSeats = [1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14]; // Seat 5 is vacant
      s.availableSeats = 1;
      s.status = 'available';
      this.db.saveToDisk();
      return { message: 'Seats preset with exactly 1 vacant seat to trigger reverse trip easily.', shuttle: s };
    }
    throw new NotFoundException(`Shuttle ${code} not found`);
  }

  createShuttle(data: {
    shuttleCode: string;
    route: { from: 'Giri' | 'Gwagwalada'; to: 'Giri' | 'Gwagwalada' };
    departureTime: string;
    arrivalTime: string;
    totalSeats: number;
    pricePerSeat: number;
    premiumPricePerSeat: number;
    driverId: string;
  }): Shuttle {
    const driver = this.db.drivers.find(d => d.id === data.driverId);
    if (!driver) {
      throw new NotFoundException(`Driver "${data.driverId}" not found`);
    }
    const newShuttle: Shuttle = {
      id: `sh_${Date.now()}`,
      shuttleCode: data.shuttleCode,
      route: data.route,
      departureTime: data.departureTime,
      arrivalTime: data.arrivalTime,
      totalSeats: data.totalSeats,
      availableSeats: data.totalSeats,
      bookedSeats: [],
      pricePerSeat: data.pricePerSeat,
      premiumPricePerSeat: data.premiumPricePerSeat,
      status: 'available',
      driver,
    };
    this.db.shuttles.push(newShuttle);
    this.db.saveToDisk();
    this.logger.log(`New shuttle created: ${newShuttle.shuttleCode} (${newShuttle.id})`);
    return newShuttle;
  }

  updateShuttle(id: string, updates: Partial<{ departureTime: string; arrivalTime: string; status: string; driverId: string }>): Shuttle {
    const shuttle = this.db.shuttles.find(s => s.id === id);
    if (!shuttle) throw new NotFoundException(`Shuttle "${id}" not found`);

    if (updates.departureTime) shuttle.departureTime = updates.departureTime;
    if (updates.arrivalTime) shuttle.arrivalTime = updates.arrivalTime;
    if (updates.status) shuttle.status = updates.status as any;
    if (updates.driverId) {
      const driver = this.db.drivers.find(d => d.id === updates.driverId);
      if (driver) shuttle.driver = driver;
    }
    this.db.saveToDisk();
    return shuttle;
  }

  deleteShuttle(id: string): { message: string } {
    const idx = this.db.shuttles.findIndex(s => s.id === id);
    if (idx === -1) throw new NotFoundException(`Shuttle "${id}" not found`);
    this.db.shuttles.splice(idx, 1);
    this.db.saveToDisk();
    return { message: `Shuttle ${id} deleted.` };
  }
}

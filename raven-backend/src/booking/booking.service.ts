import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DbService } from '../db/db.service';
import { Booking, RideHistoryEntry, Driver, Shuttle, Complaint } from '../db/types';
import { BookingGateway } from './booking.gateway';

@Injectable()
export class BookingService {
  private readonly logger = new Logger('BookingService');

  constructor(
    private readonly db: DbService,
    private readonly bookingGateway: BookingGateway,
  ) {}

  /* ── Ride History ──────────────────────────────────────── */

  getLastRide(): RideHistoryEntry | null {
    return this.db.lastRide;
  }

  getRideHistory(page = 1, limit = 20): { data: RideHistoryEntry[]; total: number; page: number; limit: number; totalPages: number } {
    const total = this.db.rideHistory.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const data = this.db.rideHistory.slice(start, start + limit);
    return { data, total, page, limit, totalPages };
  }

  getRideDetails(id: string): RideHistoryEntry {
    const found = this.db.rideHistory.find(r => r.id === id);
    if (!found) {
      const b = this.db.bookings.find(booking => booking.id === id);
      if (b) {
        return {
          id: b.id,
          bookingId: b.id,
          type: b.type === 'shuttle' ? 'shuttle' : 'keke',
          driver: b.driver,
          route: b.route,
          date: 'Just now',
          price: b.totalAmount,
          ticketId: b.ticketId || `TKT-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
          canCall: true,
          canRate: true,
          isFavorited: !!b.driver.isFavorite,
        };
      }
      throw new NotFoundException(`Ride details with ID "${id}" not found`);
    }
    return found;
  }

  /* ── Booking CRUD ──────────────────────────────────────── */

  getBooking(id: string): Booking {
    const found = this.db.bookings.find(b => b.id === id);
    if (!found) {
      throw new NotFoundException(`Booking with ID "${id}" not found`);
    }
    return found;
  }

  getBookings(page = 1, limit = 20): { data: Booking[]; total: number; page: number; limit: number; totalPages: number } {
    const total = this.db.bookings.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const data = this.db.bookings.slice(start, start + limit);
    return { data, total, page, limit, totalPages };
  }

  createBooking(data: {
    type: string;
    amount: number;
    driverId?: string;
    seats?: number[];
    isPremium?: boolean;
    route?: string;
    shuttleId?: string;
    departureTime?: string;
  }): Booking {
    let driver: Driver;
    let targetShuttle: Shuttle | undefined;
    let txDescription = 'Ride payment';

    if (data.shuttleId) {
      targetShuttle = this.db.shuttles.find(sh => sh.id === data.shuttleId || sh.shuttleCode === data.shuttleId);
      driver = targetShuttle ? targetShuttle.driver : this.db.drivers[0];
      
      if (targetShuttle && data.seats) {
        // Verify seats aren't already booked
        const alreadyBooked = data.seats.filter(s => targetShuttle!.bookedSeats.includes(s));
        if (alreadyBooked.length > 0) {
          throw new BadRequestException(`Seats ${alreadyBooked.join(', ')} are already booked`);
        }

        targetShuttle.bookedSeats = Array.from(new Set([...targetShuttle.bookedSeats, ...data.seats]));
        targetShuttle.availableSeats = Math.max(0, targetShuttle.totalSeats - targetShuttle.bookedSeats.length);
        
        // Build contextual transaction description
        txDescription = `Shuttle ${targetShuttle.shuttleCode} — ${targetShuttle.route.from} → ${targetShuttle.route.to} (Seats: ${data.seats.sort((a, b) => a - b).join(', ')})`;
        
        if (targetShuttle.availableSeats === 0) {
          targetShuttle.status = 'full';
          
          // Generate automated inbound alert reverse trip if fully booked
          const oppositeRoute = targetShuttle.route.from === 'Giri' ? 'Gwagwalada → Giri' : 'Giri → Gwagwalada';
          const reverseTrip = {
            id: `RT-${Date.now()}`,
            vehicleCode: targetShuttle.shuttleCode,
            driverName: targetShuttle.driver.name,
            vehicleDetails: `Toyota HiAce - White (${targetShuttle.driver.vehiclePlate})`,
            route: oppositeRoute,
            status: 'INBOUND',
            estimatedArrivalAt: new Date(Date.now() + 8 * 60 * 1000).toISOString(),
            message: `Shuttle ${targetShuttle.shuttleCode} is fully booked and is now INBOUND. ETA: 8 mins.`,
            createdAt: new Date().toISOString()
          };
          this.db.reverseTrips.unshift(reverseTrip);
          this.logger.log(`[Reverse Trip Generated] Shuttle: ${targetShuttle.shuttleCode}`);
          
          // Broadcast live alert to all connected sockets
          this.bookingGateway.broadcastReverseTripAlert(reverseTrip);
        }
      }
    } else if (data.driverId) {
      driver = this.db.drivers.find(d => d.id === data.driverId) || this.db.drivers[5];
      txDescription = `Keke Ride — ${data.route || 'Campus transit'}`;
    } else {
      driver = this.db.drivers[0];
    }

    // Process wallet deduction
    if (this.db.walletDetails.balance < data.amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }
    this.db.walletDetails.balance -= data.amount;
    this.db.currentUser.walletBalance = this.db.walletDetails.balance;
    this.db.transactions.unshift({
      id: `t_${Date.now()}`,
      amount: data.amount,
      type: 'debit',
      description: txDescription,
      createdAt: new Date().toISOString(),
    });

    const newBooking: Booking = {
      id: `book_${Date.now()}`,
      type: (data.type === 'shuttle' ? 'shuttle' : data.type === 'premium' ? 'premium' : 'keke'),
      route: data.route || 'Giri ⇄ Gwagwalada',
      driver,
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

    this.db.bookings.push(newBooking);

    const historyEntry: RideHistoryEntry = {
      id: newBooking.id,
      bookingId: newBooking.id,
      type: newBooking.type === 'shuttle' ? 'shuttle' : 'keke',
      driver: newBooking.driver,
      route: newBooking.route,
      date: 'Today, Just now',
      price: newBooking.totalAmount,
      ticketId: newBooking.ticketId || '',
      canCall: true,
      canRate: true,
      isFavorited: !!newBooking.driver.isFavorite,
    };
    this.db.lastRide = historyEntry;
    this.db.rideHistory.push(historyEntry);
    this.db.saveToDisk();

    // Broadcast live seat inventory updates to all active clients
    if (targetShuttle) {
      this.bookingGateway.broadcastShuttleUpdate(targetShuttle.id, targetShuttle);
    }

    return newBooking;
  }

  /* ── Booking Lifecycle ─────────────────────────────────── */

  cancelBooking(id: string): Booking {
    const booking = this.db.bookings.find(b => b.id === id);
    if (!booking) {
      throw new NotFoundException(`Booking with ID "${id}" not found`);
    }
    if (booking.status !== 'confirmed') {
      throw new BadRequestException(`Cannot cancel a booking with status "${booking.status}"`);
    }

    booking.status = 'expired';

    // Release seats back to shuttle
    if (booking.seats && booking.seats.length > 0) {
      const shuttle = this.db.shuttles.find(sh => booking.route.includes(sh.route.from));
      if (shuttle) {
        shuttle.bookedSeats = shuttle.bookedSeats.filter(s => !booking.seats!.includes(s));
        shuttle.availableSeats = shuttle.totalSeats - shuttle.bookedSeats.length;
        if (shuttle.status === 'full') shuttle.status = 'available';
        this.bookingGateway.broadcastShuttleUpdate(shuttle.id, shuttle);
      }
    }

    // Refund wallet
    this.db.walletDetails.balance += booking.totalAmount;
    this.db.currentUser.walletBalance = this.db.walletDetails.balance;
    this.db.transactions.unshift({
      id: `t_refund_${Date.now()}`,
      amount: booking.totalAmount,
      type: 'credit',
      description: `Refund — Cancelled booking ${booking.ticketId || booking.id}`,
      createdAt: new Date().toISOString(),
    });

    this.db.saveToDisk();
    this.logger.log(`Booking ${id} cancelled and ₦${booking.totalAmount} refunded.`);
    return booking;
  }

  completeBooking(id: string): Booking {
    const booking = this.db.bookings.find(b => b.id === id);
    if (!booking) {
      throw new NotFoundException(`Booking with ID "${id}" not found`);
    }
    if (booking.status !== 'confirmed') {
      throw new BadRequestException(`Cannot complete a booking with status "${booking.status}"`);
    }
    booking.status = 'completed';
    this.db.saveToDisk();
    this.logger.log(`Booking ${id} marked as completed.`);
    return booking;
  }

  /* ── Booking Expiry Cron Job ───────────────────────────── */

  @Cron(CronExpression.EVERY_MINUTE)
  handleBookingExpiry() {
    const now = new Date();
    let expiredCount = 0;

    for (const booking of this.db.bookings) {
      if (booking.status === 'confirmed' && new Date(booking.expiresAt) < now) {
        booking.status = 'expired';
        expiredCount++;

        // Release seats back to shuttle
        if (booking.seats && booking.seats.length > 0) {
          const shuttle = this.db.shuttles.find(sh => 
            sh.bookedSeats.some(s => booking.seats!.includes(s))
          );
          if (shuttle) {
            shuttle.bookedSeats = shuttle.bookedSeats.filter(s => !booking.seats!.includes(s));
            shuttle.availableSeats = shuttle.totalSeats - shuttle.bookedSeats.length;
            if (shuttle.status === 'full') shuttle.status = 'available';
            this.bookingGateway.broadcastShuttleUpdate(shuttle.id, shuttle);
          }
        }
      }
    }

    if (expiredCount > 0) {
      this.db.saveToDisk();
      this.logger.log(`[Cron] Expired ${expiredCount} booking(s) and released seats.`);
    }
  }

  /* ── Complaints ────────────────────────────────────────── */

  submitComplaint(complaintData: { bookingId: string; driverId: string; message: string }): Complaint {
    const newComplaint: Complaint = {
      id: `c_${Date.now()}`,
      bookingId: complaintData.bookingId,
      driverId: complaintData.driverId,
      message: complaintData.message,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.db.complaints.push(newComplaint);
    this.db.saveToDisk();
    return newComplaint;
  }

  getComplaints(page = 1, limit = 20): { data: Complaint[]; total: number; page: number; limit: number; totalPages: number } {
    const total = this.db.complaints.length;
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit;
    const data = this.db.complaints.slice(start, start + limit);
    return { data, total, page, limit, totalPages };
  }

  getComplaint(id: string): Complaint {
    const found = this.db.complaints.find(c => c.id === id);
    if (!found) {
      throw new NotFoundException(`Complaint with ID "${id}" not found`);
    }
    return found;
  }

  resolveComplaint(id: string): Complaint {
    const complaint = this.db.complaints.find(c => c.id === id);
    if (!complaint) {
      throw new NotFoundException(`Complaint with ID "${id}" not found`);
    }
    complaint.status = 'resolved';
    this.db.saveToDisk();
    this.logger.log(`Complaint ${id} resolved.`);
    return complaint;
  }
}

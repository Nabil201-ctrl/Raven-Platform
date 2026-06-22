import { Injectable, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DbService } from '../db/db.service';
import { BookingGateway } from '../booking/booking.gateway';
import {
  TRANSIT_OPEN_HOUR,
  TRANSIT_CLOSE_HOUR,
  TRANSIT_TIMEZONE,
  TransitDayStatus,
  getLagosClock,
  isWithinTransitHours,
  buildTransitMessage,
} from '../common/transit-schedule';

export interface TransitStatusResponse {
  status: TransitDayStatus;
  isWithinHours: boolean;
  isDayStarted: boolean;
  dayStartedAt: string | null;
  startedByDriverId: string | null;
  startedByDriverName: string | null;
  startedByBookingId: string | null;
  openHour: number;
  closeHour: number;
  timezone: string;
  localTime: string;
  localDate: string;
  message: string;
}

@Injectable()
export class TransitScheduleService {
  private readonly logger = new Logger('TransitScheduleService');

  constructor(
    private readonly db: DbService,
    @Inject(forwardRef(() => BookingGateway))
    private readonly bookingGateway: BookingGateway,
  ) {}

  getStatus(): TransitStatusResponse {
    const clock = getLagosClock();
    const withinHours = isWithinTransitHours(clock);
    const session = this.db.dailyTransitSession;
    const sessionValid = !!(session && session.date === clock.date);
    const isDayStarted = sessionValid && !!session?.startedAt;

    let status: TransitDayStatus = 'closed';
    if (withinHours) {
      status = isDayStarted ? 'active' : 'standby';
    }

    const startedDriver = session?.startedByDriverId
      ? this.db.drivers.find(d => d.id === session.startedByDriverId)
      : undefined;

    return {
      status,
      isWithinHours: withinHours,
      isDayStarted,
      dayStartedAt: sessionValid ? session!.startedAt : null,
      startedByDriverId: sessionValid ? session!.startedByDriverId || null : null,
      startedByDriverName: startedDriver?.name || null,
      startedByBookingId: sessionValid ? session!.startedByBookingId || null : null,
      openHour: TRANSIT_OPEN_HOUR,
      closeHour: TRANSIT_CLOSE_HOUR,
      timezone: TRANSIT_TIMEZONE,
      localTime: clock.timeLabel,
      localDate: clock.date,
      message: buildTransitMessage(status, clock),
    };
  }

  assertWithinOperatingHours(): void {
    const status = this.getStatus();
    if (!status.isWithinHours) {
      throw new BadRequestException(status.message);
    }
  }

  assertDayStartedForPassengers(): void {
    const status = this.getStatus();
    if (!status.isWithinHours) {
      throw new BadRequestException(status.message);
    }
    if (!status.isDayStarted) {
      throw new BadRequestException(
        'Transit has not started for today yet. Service begins when the first driver lists on a route.',
      );
    }
  }

  ensureDayStarted(opts: { driverId?: string; bookingId?: string }): TransitStatusResponse {
    this.assertWithinOperatingHours();
    const clock = getLagosClock();
    const existing = this.db.dailyTransitSession;

    if (existing && existing.date === clock.date && existing.startedAt) {
      return this.getStatus();
    }

    const now = new Date().toISOString();
    this.db.dailyTransitSession = {
      date: clock.date,
      startedAt: now,
      startedByDriverId: opts.driverId,
      startedByBookingId: opts.bookingId,
    };
    this.db.saveToDisk();
    this.logger.log(
      `[Transit] Day started for ${clock.date}` +
        (opts.driverId ? ` by driver ${opts.driverId}` : '') +
        (opts.bookingId ? ` via booking ${opts.bookingId}` : ''),
    );
    const status = this.getStatus();
    this.bookingGateway.emitTransitDayStarted(status);
    return status;
  }

  clearAllCarrierListings(): number {
    let cleared = 0;
    for (const driver of this.db.drivers) {
      if (driver.isCarrier || driver.isActive) {
        driver.isCarrier = false;
        driver.isActive = false;
        driver.carrierRouteId = undefined;
        driver.carrierFrom = undefined;
        driver.carrierTo = undefined;
        driver.carrierNotes = undefined;
        driver.carrierSeatCapacity = undefined;
        driver.carrierListedAt = undefined;
        cleared++;
        this.bookingGateway.emitDriverCarrierUpdated(driver);
      }
    }
    if (cleared > 0) {
      this.db.saveToDisk();
      this.logger.log(`[Transit] Cleared ${cleared} carrier listing(s) outside operating hours.`);
    }
    return cleared;
  }

  @Cron(CronExpression.EVERY_MINUTE)
  handleOperatingWindowTick(): void {
    const clock = getLagosClock();
    const withinHours = isWithinTransitHours(clock);

    if (!withinHours) {
      const cleared = this.clearAllCarrierListings();
      if (cleared > 0 || clock.hour === TRANSIT_CLOSE_HOUR) {
        this.bookingGateway.emitTransitClosed(this.getStatus());
      }
      return;
    }

    const session = this.db.dailyTransitSession;
    if (session && session.date !== clock.date) {
      this.db.dailyTransitSession = null;
      this.clearAllCarrierListings();
      this.db.saveToDisk();
      this.logger.log(`[Transit] New day ${clock.date} — session reset, awaiting first driver.`);
    }
  }
}
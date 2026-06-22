import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { RouteStop, Driver } from '../db/types';
import {
  CARRIER_ROUTES,
  CARRIER_ROUTE_LOCK_MS,
  getCarrierRoute,
  maxSeatCapacity,
  VehicleType,
} from '../common/carrier-routes';
import { BookingGateway } from '../booking/booking.gateway';
import { TransitScheduleService } from '../transit/transit-schedule.service';

@Injectable()
export class DriverService implements OnModuleInit {
  private atVoice: any;

  constructor(
    private readonly db: DbService,
    private readonly bookingGateway: BookingGateway,
    private readonly transitSchedule: TransitScheduleService,
  ) {}

  async onModuleInit() {
    try {
      const ATLib = require('africastalking');
      const AfricasTalking = ATLib.default || ATLib;
      const at = AfricasTalking({
        apiKey: (process.env.AT_API_KEY || 'sandbox').trim(),
        username: (process.env.AT_USERNAME || 'sandbox').trim(),
      });
      this.atVoice = at.VOICE;
      console.log(`[Africa's Talking Init] Initialized voice client successfully`);
    } catch (e: any) {
      console.warn(`[Africa's Talking Init] Failed to initialize:`, e.message);
    }
  }

  registerDriver(name: string, vehicleType: 'shuttle' | 'keke' | 'bike', vehiclePlate: string): Driver {
    let code = '';
    do {
      code = Math.floor(1000 + Math.random() * 9000).toString();
    } while (this.db.drivers.some(d => d.systemCode === code));

    const newDriver: Driver = {
      id: `drv_${Date.now()}`,
      name,
      photo: '',
      vehicleType,
      vehiclePlate,
      systemCode: code,
      rating: 5.0,
      isActive: false,
      isVerified: false,
      isApproved: false,
      isFavorite: false,
    };
    this.db.drivers.push(newDriver);
    this.db.saveToDisk();
    return newDriver;
  }

  verifyDriver(id: string): Driver {
    const found = this.db.drivers.find(d => d.id === id);
    if (!found) {
      throw new NotFoundException(`Driver with ID "${id}" not found`);
    }
    found.isVerified = true;
    this.db.saveToDisk();
    return found;
  }

  approveDriver(id: string): Driver {
    const found = this.db.drivers.find(d => d.id === id);
    if (!found) {
      throw new NotFoundException(`Driver with ID "${id}" not found`);
    }
    found.isApproved = true;
    this.db.saveToDisk();
    return found;
  }

  getAllDrivers(): Driver[] {
    return this.db.drivers;
  }

  private enrichDriverCarrierLock(driver: Driver): Driver {
    if (!driver.carrierListedAt) {
      return { ...driver, carrierRouteLockedUntil: undefined };
    }
    const lockedUntil = new Date(
      new Date(driver.carrierListedAt).getTime() + CARRIER_ROUTE_LOCK_MS,
    ).toISOString();
    return { ...driver, carrierRouteLockedUntil: lockedUntil };
  }

  private validateSeatCapacity(vehicleType: VehicleType, seatCapacity: number): void {
    const max = maxSeatCapacity(vehicleType);
    if (!Number.isInteger(seatCapacity) || seatCapacity < 1 || seatCapacity > max) {
      throw new BadRequestException(
        `Seat capacity must be between 1 and ${max} for a ${vehicleType}`,
      );
    }
  }

  private syncShuttleSeatCapacity(driver: Driver, seatCapacity: number): void {
    if (driver.vehicleType !== 'shuttle') return;
    const shuttle = this.db.shuttles.find(s => s.driver.id === driver.id);
    if (!shuttle) return;

    const booked = shuttle.bookedSeats.length;
    if (seatCapacity < booked) {
      throw new BadRequestException(
        `Cannot set ${seatCapacity} seats — ${booked} seat(s) are already booked on your shuttle`,
      );
    }

    shuttle.totalSeats = seatCapacity;
    shuttle.availableSeats = seatCapacity - booked;
    shuttle.status = shuttle.availableSeats === 0 ? 'full' : 'available';
    shuttle.driver = { ...shuttle.driver, carrierSeatCapacity: seatCapacity };
  }

  private assertCanChangeCarrierRoute(driver: Driver, newRouteId: string): void {
    if (!driver.isCarrier || !driver.carrierListedAt || driver.carrierRouteId === newRouteId) {
      return;
    }
    const elapsed = Date.now() - new Date(driver.carrierListedAt).getTime();
    if (elapsed < CARRIER_ROUTE_LOCK_MS) {
      const minutesLeft = Math.ceil((CARRIER_ROUTE_LOCK_MS - elapsed) / 60000);
      throw new BadRequestException(
        `Your route is locked for ${minutesLeft} more minute(s). Drivers must stay on a route for at least 2 hours before changing.`,
      );
    }
  }

  getCarrierRoutes() {
    return CARRIER_ROUTES;
  }

  getCarriers(filters?: { routeId?: string; from?: RouteStop; to?: RouteStop }): Driver[] {
    const transit = this.transitSchedule.getStatus();
    if (transit.status !== 'active') {
      return [];
    }
    return this.db.drivers.filter(d => {
      if (!d.isCarrier || !d.isActive || !d.isVerified || !d.isApproved) return false;
      if (filters?.routeId && d.carrierRouteId !== filters.routeId) return false;
      if (filters?.from && d.carrierFrom !== filters.from) return false;
      if (filters?.to && d.carrierTo !== filters.to) return false;
      return true;
    });
  }

  registerCarrier(driverId: string, routeId: string, seatCapacity: number, notes?: string): Driver {
    this.transitSchedule.assertWithinOperatingHours();

    const driver = this.db.drivers.find(d => d.id === driverId);
    if (!driver) {
      throw new NotFoundException(`Driver with ID "${driverId}" not found`);
    }
    if (!driver.isVerified || !driver.isApproved) {
      throw new BadRequestException('Driver must be verified and approved before listing as a carrier');
    }

    this.validateSeatCapacity(driver.vehicleType, seatCapacity);

    const route = getCarrierRoute(routeId);
    if (!route) {
      throw new BadRequestException(`Unknown route "${routeId}"`);
    }

    const shouldStartDay = !this.transitSchedule.getStatus().isDayStarted;

    if (driver.isCarrier && driver.carrierRouteId === route.id) {
      driver.carrierNotes = notes?.trim() || undefined;
      driver.carrierSeatCapacity = seatCapacity;
      this.syncShuttleSeatCapacity(driver, seatCapacity);
      this.db.saveToDisk();
      if (shouldStartDay) {
        this.transitSchedule.ensureDayStarted({ driverId });
      }
      const enriched = this.enrichDriverCarrierLock(driver);
      this.bookingGateway.emitDriverCarrierUpdated(enriched);
      return enriched;
    }

    this.assertCanChangeCarrierRoute(driver, route.id);

    const isRouteChange = driver.isCarrier && driver.carrierRouteId !== route.id;
    driver.isCarrier = true;
    driver.isActive = true;
    driver.carrierRouteId = route.id;
    driver.carrierFrom = route.from;
    driver.carrierTo = route.to;
    driver.carrierNotes = notes?.trim() || undefined;
    driver.carrierSeatCapacity = seatCapacity;
    this.syncShuttleSeatCapacity(driver, seatCapacity);
    if (!driver.carrierListedAt || isRouteChange) {
      driver.carrierListedAt = new Date().toISOString();
    }
    this.db.saveToDisk();
    if (shouldStartDay) {
      this.transitSchedule.ensureDayStarted({ driverId });
    }
    const enriched = this.enrichDriverCarrierLock(driver);
    this.bookingGateway.emitDriverCarrierUpdated(enriched);
    return enriched;
  }

  clearCarrier(driverId: string): Driver {
    const driver = this.db.drivers.find(d => d.id === driverId);
    if (!driver) {
      throw new NotFoundException(`Driver with ID "${driverId}" not found`);
    }
    driver.isCarrier = false;
    driver.isActive = false;
    driver.carrierRouteId = undefined;
    driver.carrierFrom = undefined;
    driver.carrierTo = undefined;
    driver.carrierNotes = undefined;
    driver.carrierSeatCapacity = undefined;
    driver.carrierListedAt = undefined;
    this.db.saveToDisk();
    const enriched = this.enrichDriverCarrierLock(driver);
    this.bookingGateway.emitDriverCarrierUpdated(enriched);
    return enriched;
  }

  verifyDriverCode(code: string): Driver {
    const upper = code.toUpperCase();
    const found = this.db.drivers.find(d => d.systemCode === upper);
    if (!found) {
      throw new NotFoundException(`Driver profile with system code "${code}" not found`);
    }
    return this.enrichDriverCarrierLock(found);
  }

  getDriverDetails(driverId: string): Driver {
    const found = this.db.drivers.find(d => d.id === driverId || d.systemCode === driverId);
    if (!found) {
      throw new NotFoundException(`Driver with ID/Code "${driverId}" not found`);
    }
    return this.enrichDriverCarrierLock(found);
  }

  rateDriver(driverId: string, rating: number): Driver {
    const driver = this.db.drivers.find(d => d.id === driverId);
    if (!driver) {
      throw new NotFoundException(`Driver with ID "${driverId}" not found`);
    }
    driver.rating = parseFloat(((driver.rating * 4 + rating) / 5).toFixed(1));
    this.db.saveToDisk();
    return driver;
  }

  toggleFavoriteDriver(driverId: string, isFavorite: boolean): Driver {
    const driver = this.db.drivers.find(d => d.id === driverId);
    if (!driver) {
      throw new NotFoundException(`Driver with ID "${driverId}" not found`);
    }
    driver.isFavorite = isFavorite;
    this.db.saveToDisk();
    return driver;
  }

  setActiveStatus(driverId: string, isActive: boolean): Driver {
    const driver = this.db.drivers.find(d => d.id === driverId);
    if (!driver) {
      throw new NotFoundException(`Driver with ID "${driverId}" not found`);
    }
    driver.isActive = !!isActive;
    if (!isActive) {
      driver.isCarrier = false;
      driver.carrierRouteId = undefined;
      driver.carrierFrom = undefined;
      driver.carrierTo = undefined;
      driver.carrierNotes = undefined;
      driver.carrierSeatCapacity = undefined;
      driver.carrierListedAt = undefined;
    }
    this.db.saveToDisk();
    if (!isActive) {
      this.bookingGateway.emitDriverCarrierUpdated(driver);
    }
    return driver;
  }

  async initiateMaskedCall(driverId: string) {
    const driver = this.db.drivers.find(d => d.id === driverId);
    if (!driver) {
      throw new NotFoundException(`Driver with ID "${driverId}" not found`);
    }

    const atVirtualNumber = (process.env.AT_VIRTUAL_NUMBER || '+2347007488853').trim();
    const userPhone = (process.env.USER_PHONE_NUMBER || '+2348031234567').trim();

    const isProduction = 
      process.env.AT_USERNAME && 
      process.env.AT_USERNAME.trim() !== 'sandbox' && 
      process.env.AT_API_KEY && 
      !process.env.AT_API_KEY.trim().includes('sandbox');

    if (this.atVoice) {
      try {
        console.log(`[Africa's Talking] Dialing initiator User A: ${userPhone} from Virtual Number: ${atVirtualNumber}`);
        const response = await this.atVoice.call({
          callFrom: atVirtualNumber,
          callTo: [userPhone]
        });
        console.log(`[Africa's Talking] Call queued successfully:`, response);
        return {
          success: true,
          callSessionId: `call_at_${Date.now()}`,
          maxDurationSeconds: 180,
          driverName: driver.name,
          proxyPhone: atVirtualNumber,
          data: response
        };
      } catch (error: any) {
        console.error(`[Africa's Talking SDK Error] Failed to place outbound voice call:`, error.message);
        if (isProduction) {
          throw new BadRequestException(`Failed to initiate real outbound voice call: ${error.message}`);
        }
      }
    }

    if (isProduction) {
      throw new BadRequestException(`Africa's Talking voice client is not initialized. Outbound calls are disabled.`);
    }

    // High-fidelity fallback / Sandbox simulation mode when SDK is offline or sandbox API key is not configured
    console.log(`[Africa's Talking Simulator] Bypassing call trigger for ${driver.name}. Preserving premium proxy dial.`);
    return {
      success: true,
      callSessionId: `call_sim_${Date.now()}`,
      maxDurationSeconds: 180,
      driverName: driver.name,
      proxyPhone: driver.systemCode === '1001' ? '+234 700 748 8853' : '+234 700 748 8854',
      simulated: true
    };
  }

  voiceCallback(payload: any): string {
    const isActive = payload.isActive;
    const callerNumber = payload.callerNumber;
    console.log(`[Africa's Talking Voice Webhook] isActive: ${isActive}, callerNumber: ${callerNumber}`);

    if (isActive === '1') {
      const driverPhone = (process.env.DRIVER_PHONE_NUMBER || '+2348098765432').trim();
      console.log(`[Africa's Talking Voice Webhook] Bridging caller to driver at ${driverPhone}`);
      return `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Dial phoneNumbers="${driverPhone}" record="true" />
        </Response>`;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Hangup/>
      </Response>`;
  }
}

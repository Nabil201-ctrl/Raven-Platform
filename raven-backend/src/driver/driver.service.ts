import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { DbService } from '../db/db.service';
import { Driver } from '../db/types';

@Injectable()
export class DriverService implements OnModuleInit {
  private atVoice: any;

  constructor(private readonly db: DbService) {}

  async onModuleInit() {
    try {
      const AfricasTalking = require('africastalking');
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

  verifyDriverCode(code: string): Driver {
    const upper = code.toUpperCase();
    const found = this.db.drivers.find(d => d.systemCode === upper);
    if (!found) {
      // Dynamic fallback for custom inputs
      const tempDriver: Driver = {
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
      this.db.drivers.push(tempDriver);
      this.db.saveToDisk();
      return tempDriver;
    }
    return found;
  }

  getDriverDetails(driverId: string): Driver {
    const found = this.db.drivers.find(d => d.id === driverId || d.systemCode === driverId);
    if (!found) {
      throw new NotFoundException(`Driver with ID/Code "${driverId}" not found`);
    }
    return found;
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

  async initiateMaskedCall(driverId: string) {
    const driver = this.db.drivers.find(d => d.id === driverId);
    if (!driver) {
      throw new NotFoundException(`Driver with ID "${driverId}" not found`);
    }

    const atVirtualNumber = (process.env.AT_VIRTUAL_NUMBER || '+2347007488853').trim();
    const userPhone = (process.env.USER_PHONE_NUMBER || '+2348031234567').trim();

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
      }
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

import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { DbModule } from './db/db.module';
import { HealthModule } from './health/health.module';
import { UserModule } from './user/user.module';
import { WalletModule } from './wallet/wallet.module';
import { DriverModule } from './driver/driver.module';
import { ShuttleModule } from './shuttle/shuttle.module';
import { BookingModule } from './booking/booking.module';

@Module({
  imports: [
    // Global rate limiting: 100 requests per 60 seconds per IP
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    // Cron / Interval scheduling for booking expiry and reverse trip cleanup
    ScheduleModule.forRoot(),
    DbModule,
    HealthModule,
    UserModule,
    WalletModule,
    DriverModule,
    ShuttleModule,
    BookingModule,
  ],
  providers: [
    // Apply throttler globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

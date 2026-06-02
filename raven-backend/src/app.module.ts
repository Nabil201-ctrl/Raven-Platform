import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
// import { MongooseModule } from '@nestjs/mongoose';
// import { CacheModule } from '@nestjs/cache-manager';
// import { redisStore } from 'cache-manager-redis-yet';
import { DbModule } from './db/db.module';
import { HealthModule } from './health/health.module';
import { UserModule } from './user/user.module';
import { WalletModule } from './wallet/wallet.module';
import { DriverModule } from './driver/driver.module';
import { ShuttleModule } from './shuttle/shuttle.module';
import { BookingModule } from './booking/booking.module';

@Module({
  imports: [
    // Global Configuration for .env
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Global rate limiting: 100 requests per 60 seconds per IP
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    // Redis Global Cache (Commented out to prevent startup blocking - unused)
    /*
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        url: configService.get<string>('REDIS_URI') || 'redis://localhost:6379',
        ttl: 60000, // Default TTL of 60 seconds
      }),
      inject: [ConfigService],
    }),
    */
    // Cron / Interval scheduling for booking expiry and reverse trip cleanup
    ScheduleModule.forRoot(),
    // MongoDB Connection (Commented out to prevent startup blocking - unused)
    /*
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') || 'mongodb://localhost:27017/raven',
      }),
      inject: [ConfigService],
    }),
    */
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

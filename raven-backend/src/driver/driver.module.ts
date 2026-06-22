import { Module } from '@nestjs/common';
import { DriverController } from './driver.controller';
import { DriverService } from './driver.service';
import { BookingModule } from '../booking/booking.module';
import { TransitModule } from '../transit/transit.module';

@Module({
  imports: [BookingModule, TransitModule],
  controllers: [DriverController],
  providers: [DriverService],
  exports: [DriverService],
})
export class DriverModule {}

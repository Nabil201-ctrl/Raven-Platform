import { Module, forwardRef } from '@nestjs/common';
import { TransitScheduleService } from './transit-schedule.service';
import { TransitController } from './transit.controller';
import { BookingModule } from '../booking/booking.module';

@Module({
  imports: [forwardRef(() => BookingModule)],
  controllers: [TransitController],
  providers: [TransitScheduleService],
  exports: [TransitScheduleService],
})
export class TransitModule {}
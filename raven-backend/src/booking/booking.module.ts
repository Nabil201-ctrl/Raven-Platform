import { Module } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { BookingGateway } from './booking.gateway';

@Module({
  controllers: [BookingController],
  providers: [BookingService, BookingGateway],
  exports: [BookingService, BookingGateway],
})
export class BookingModule {}


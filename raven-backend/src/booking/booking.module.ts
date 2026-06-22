import { Module, forwardRef } from '@nestjs/common';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { BookingGateway } from './booking.gateway';
import { TransitModule } from '../transit/transit.module';

@Module({
  imports: [forwardRef(() => TransitModule)],
  controllers: [BookingController],
  providers: [BookingService, BookingGateway],
  exports: [BookingService, BookingGateway],
})
export class BookingModule {}


import { Controller, Get } from '@nestjs/common';
import { TransitScheduleService } from './transit-schedule.service';

@Controller('api/transit')
export class TransitController {
  constructor(private readonly transitSchedule: TransitScheduleService) {}

  @Get('status')
  getStatus() {
    return this.transitSchedule.getStatus();
  }
}
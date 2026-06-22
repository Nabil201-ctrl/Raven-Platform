import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ShuttleService } from './shuttle.service';
import { AdminGuard } from '../common/guards/auth.guard';
import { ResetSeatsDto, CreateShuttleDto, UpdateShuttleDto } from '../common/dto/shuttle.dto';


@Controller('api')
export class ShuttleController {
  constructor(private readonly shuttleService: ShuttleService) {}

  @Get('shuttles/available')
  getAvailableShuttles() {
    return this.shuttleService.getAvailableShuttles();
  }

  @Get('shuttles/recommended')
  getRecommendedShuttles() {
    return this.shuttleService.getRecommendedShuttles();
  }

  @Get('shuttles/:id')
  getShuttleDetails(@Param('id') id: string) {
    return this.shuttleService.getShuttleDetails(id);
  }

  @Get('transit/vehicle/:code')
  getVehicleDetailsByCode(@Param('code') code: string) {
    return this.shuttleService.getVehicleDetailsByCode(code);
  }

  @Get('transit/reverse-trips')
  getReverseTrips() {
    return this.shuttleService.getReverseTrips();
  }

  @Patch('transit/reverse-trips/:id/arrived')
  arriveReverseTrip(@Param('id') id: string) {
    return this.shuttleService.arriveReverseTrip(id);
  }

  /* ── Admin Operations ── */

  @Post('transit/reset-seats')
  @UseGuards(AdminGuard)
  resetSeats(@Body() body: ResetSeatsDto) {
    return this.shuttleService.resetSeats(body.code);
  }

  @Post('admin/shuttles')
  @UseGuards(AdminGuard)
  createShuttle(@Body() data: CreateShuttleDto) {
    return this.shuttleService.createShuttle(data);
  }

  @Patch('admin/shuttles/:id')
  @UseGuards(AdminGuard)
  updateShuttle(@Param('id') id: string, @Body() updates: UpdateShuttleDto) {
    return this.shuttleService.updateShuttle(id, updates);
  }

  @Delete('admin/shuttles/:id')
  @UseGuards(AdminGuard)
  deleteShuttle(@Param('id') id: string) {
    return this.shuttleService.deleteShuttle(id);
  }
}

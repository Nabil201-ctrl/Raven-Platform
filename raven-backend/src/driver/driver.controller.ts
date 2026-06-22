import { Controller, Get, Post, Delete, Body, Param, Query, Res, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { DriverService } from './driver.service';
import { RateDriverDto, FavoriteDriverDto, RegisterDriverDto, RegisterCarrierDto, VoiceCallbackDto } from '../common/dto/driver.dto';
import { AdminGuard } from '../common/guards/auth.guard';
import { UserSessionGuard } from '../common/guards/user-session.guard';


@Controller('api')
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Get('drivers')
  getAllDrivers() {
    return this.driverService.getAllDrivers();
  }

  @Get('drivers/carrier-routes')
  getCarrierRoutes() {
    return this.driverService.getCarrierRoutes();
  }

  @Get('drivers/carriers')
  getCarriers(
    @Query('routeId') routeId?: string,
    @Query('from') from?: 'Giri' | 'Gwagwalada' | 'Main Campus',
    @Query('to') to?: 'Giri' | 'Gwagwalada' | 'Main Campus',
  ) {
    return this.driverService.getCarriers({ routeId, from, to });
  }

  @Post('drivers/register')
  registerDriver(@Body() body: RegisterDriverDto) {
    return this.driverService.registerDriver(body.name, body.vehicleType, body.vehiclePlate);
  }

  @Post('drivers/:id/verify')
  @UseGuards(AdminGuard)
  verifyDriver(@Param('id') id: string) {
    return this.driverService.verifyDriver(id);
  }

  @Post('drivers/:id/approve')
  @UseGuards(AdminGuard)
  approveDriver(@Param('id') id: string) {
    return this.driverService.approveDriver(id);
  }

  @Get('drivers/verify/:code')
  verifyDriverCode(@Param('code') code: string) {
    return this.driverService.verifyDriverCode(code);
  }

  @Get('drivers/:id')
  getDriverDetails(@Param('id') id: string) {
    return this.driverService.getDriverDetails(id);
  }

  @Post('drivers/:id/rate')
  @UseGuards(UserSessionGuard)
  rateDriver(@Param('id') id: string, @Body() body: RateDriverDto) {
    return this.driverService.rateDriver(id, body.rating);
  }

  @Post('drivers/:id/favorite')
  @UseGuards(UserSessionGuard)
  toggleFavoriteDriver(@Param('id') id: string, @Body() body: FavoriteDriverDto) {
    return this.driverService.toggleFavoriteDriver(id, body.isFavorite);
  }

  @Post('drivers/:id/active')
  setActive(@Param('id') id: string, @Body() body: { isActive: boolean }) {
    return this.driverService.setActiveStatus(id, body.isActive);
  }

  @Post('drivers/:id/carrier')
  registerCarrier(@Param('id') id: string, @Body() body: RegisterCarrierDto) {
    return this.driverService.registerCarrier(id, body.routeId, body.seatCapacity, body.notes);
  }

  @Delete('drivers/:id/carrier')
  clearCarrier(@Param('id') id: string) {
    return this.driverService.clearCarrier(id);
  }

  @Post('drivers/:id/call')
  @UseGuards(UserSessionGuard)
  async initiateMaskedCall(@Param('id') id: string) {
    return this.driverService.initiateMaskedCall(id);
  }

  @Post('voice-callback')
  @HttpCode(HttpStatus.OK)
  voiceCallback(@Body() payload: VoiceCallbackDto, @Res() res: any) {
    const xml = this.driverService.voiceCallback(payload);
    res.set('Content-Type', 'application/xml');
    return res.send(xml);
  }
}

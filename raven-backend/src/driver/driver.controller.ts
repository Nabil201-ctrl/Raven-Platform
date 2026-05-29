import { Controller, Get, Post, Body, Param, Res, HttpCode, HttpStatus } from '@nestjs/common';
import { DriverService } from './driver.service';
import { RateDriverDto, FavoriteDriverDto } from '../common/dto/wallet.dto';

@Controller('api')
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Get('drivers/verify/:code')
  verifyDriverCode(@Param('code') code: string) {
    return this.driverService.verifyDriverCode(code);
  }

  @Get('drivers/:id')
  getDriverDetails(@Param('id') id: string) {
    return this.driverService.getDriverDetails(id);
  }

  @Post('drivers/:id/rate')
  rateDriver(@Param('id') id: string, @Body() body: RateDriverDto) {
    return this.driverService.rateDriver(id, body.rating);
  }

  @Post('drivers/:id/favorite')
  toggleFavoriteDriver(@Param('id') id: string, @Body() body: FavoriteDriverDto) {
    return this.driverService.toggleFavoriteDriver(id, body.isFavorite);
  }

  @Post('drivers/:id/call')
  async initiateMaskedCall(@Param('id') id: string) {
    return this.driverService.initiateMaskedCall(id);
  }

  @Post('voice-callback')
  @HttpCode(HttpStatus.OK)
  voiceCallback(@Body() payload: any, @Res() res: any) {
    const xml = this.driverService.voiceCallback(payload);
    res.set('Content-Type', 'application/xml');
    return res.send(xml);
  }
}

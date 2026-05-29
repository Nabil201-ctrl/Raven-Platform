import { Controller, Get, Post, Body, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { WalletAmountDto, PurchaseMinutesDto } from '../common/dto/wallet.dto';

@Controller('api/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  getCurrentUser() {
    return this.userService.getCurrentUser();
  }

  @Get('balance')
  getWalletBalance() {
    return { balance: this.userService.getWalletBalance() };
  }

  @Get('transactions')
  getTransactions(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.userService.getTransactions(page, limit);
  }

  @Post('deduct')
  deductFromWallet(@Body() body: WalletAmountDto) {
    return this.userService.deductFromWallet(body.amount);
  }

  @Post('topup')
  addToWallet(@Body() body: WalletAmountDto) {
    return this.userService.addToWallet(body.amount);
  }

  @Get('call-minutes')
  getCallMinutes() {
    return { minutes: this.userService.getCallMinutes() };
  }

  @Post('call-minutes/purchase')
  purchaseCallMinutes(@Body() body: PurchaseMinutesDto) {
    return this.userService.purchaseCallMinutes(body.minutes);
  }

  @Post('call-minutes/consume')
  consumeCallMinute() {
    return this.userService.consumeCallMinute();
  }
}

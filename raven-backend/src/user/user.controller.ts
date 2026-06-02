import { Controller, Get, Post, Body, Query, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { WalletAmountDto, PurchaseMinutesDto } from '../common/dto/wallet.dto';
import { LoginDto, RegisterDto } from '../common/dto/auth.dto';

@Controller('api/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.userService.login(body.email, body.password);
  }

  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.userService.register(body.name, body.email, body.password);
  }

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

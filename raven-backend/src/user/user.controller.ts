import { Controller, Get, Post, Body, Query, DefaultValuePipe, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { WalletAmountDto, PurchaseMinutesDto } from '../common/dto/user.dto';
import { LoginDto, RegisterDto } from '../common/dto/auth.dto';
import { UserSessionGuard } from '../common/guards/user-session.guard';

@Controller('api/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('login')
  login(@Body() body: LoginDto) {
    return this.userService.login(body.email, body.password);
  }

  @Post('register')
  register(@Body() body: RegisterDto) {
    return this.userService.register(
      body.name,
      body.email,
      body.password,
      body.avatar,
      body.phoneNumber,
      body.role,
      body.campusId,
      body.preferredRoute,
    );
  }

  @Post('logout')
  @UseGuards(UserSessionGuard)
  logout(@Req() req: { authToken?: string }) {
    return this.userService.logout(req.authToken || '');
  }

  @Get()
  @UseGuards(UserSessionGuard)
  getCurrentUser() {
    return this.userService.getCurrentUser();
  }

  @Get('balance')
  @UseGuards(UserSessionGuard)
  getWalletBalance() {
    return { balance: this.userService.getWalletBalance() };
  }

  @Get('transactions')
  @UseGuards(UserSessionGuard)
  getTransactions(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.userService.getTransactions(page, limit);
  }

  @Post('deduct')
  @UseGuards(UserSessionGuard)
  deductFromWallet(@Body() body: WalletAmountDto) {
    return this.userService.deductFromWallet(body.amount);
  }

  @Post('topup')
  @UseGuards(UserSessionGuard)
  addToWallet(@Body() body: WalletAmountDto) {
    return this.userService.addToWallet(body.amount);
  }

  @Get('call-minutes')
  @UseGuards(UserSessionGuard)
  getCallMinutes() {
    return { minutes: this.userService.getCallMinutes() };
  }

  @Post('call-minutes/purchase')
  @UseGuards(UserSessionGuard)
  purchaseCallMinutes(@Body() body: PurchaseMinutesDto) {
    return this.userService.purchaseCallMinutes(body.minutes);
  }

  @Post('call-minutes/consume')
  @UseGuards(UserSessionGuard)
  consumeCallMinute() {
    return this.userService.consumeCallMinute();
  }
}
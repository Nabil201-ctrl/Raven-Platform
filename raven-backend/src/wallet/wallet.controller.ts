import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { UserSessionGuard } from '../common/guards/user-session.guard';
import { WalletService } from './wallet.service';
import { CreateWalletDto, MockDepositDto, WithdrawDto } from '../common/dto/wallet.dto';
import { MonnifyWebhookDto } from '../common/dto/monnify-webhook.dto';

@Controller('api')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('wallet/create')
  @UseGuards(UserSessionGuard)
  async createWallet(@Body() body: CreateWalletDto) {
    return this.walletService.createWallet(body.userId, body.name, body.email);
  }

  @Get('wallet/:userId')
  @UseGuards(UserSessionGuard)
  async getWallet(@Param('userId') userId: string) {
    return this.walletService.getWallet(userId);
  }

  @Post('monnify/webhook')
  @HttpCode(HttpStatus.OK)
  processWebhook(@Body() payload: MonnifyWebhookDto) {
    return this.walletService.processWebhook(payload);
  }

  @Post('wallet/mock-deposit')
  @UseGuards(UserSessionGuard)
  mockDeposit(@Body() body: MockDepositDto) {
    return this.walletService.mockDeposit(body.userId, body.amount);
  }

  @Post('wallet/withdraw')
  @UseGuards(UserSessionGuard)
  async withdrawFunds(@Body() body: WithdrawDto) {
    return this.walletService.withdrawFunds(body.userId, body.amount, body.bankCode, body.accountNumber, body.narration || 'Wallet Withdrawal');
  }
}

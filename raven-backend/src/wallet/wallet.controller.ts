import { Controller, Get, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { CreateWalletDto, MockDepositDto, WithdrawDto } from '../common/dto/wallet.dto';

@Controller('api')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Post('wallet/create')
  async createWallet(@Body() body: CreateWalletDto) {
    return this.walletService.createWallet(body.userId, body.name, body.email);
  }

  @Get('wallet/:userId')
  async getWallet(@Param('userId') userId: string) {
    return this.walletService.getWallet(userId);
  }

  @Post('monnify/webhook')
  @HttpCode(HttpStatus.OK)
  processWebhook(@Body() payload: any) {
    return this.walletService.processWebhook(payload);
  }

  @Post('wallet/mock-deposit')
  mockDeposit(@Body() body: MockDepositDto) {
    return this.walletService.mockDeposit(body.userId, body.amount);
  }

  @Post('wallet/withdraw')
  async withdrawFunds(@Body() body: WithdrawDto) {
    return this.walletService.withdrawFunds(body.userId, body.amount, body.bankCode, body.accountNumber, body.narration || 'Wallet Withdrawal');
  }
}

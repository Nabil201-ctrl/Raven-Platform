import { IsNumber, Min } from 'class-validator';

export class WalletAmountDto {
  @IsNumber()
  @Min(1, { message: 'Amount must be at least 1' })
  amount!: number;
}

export class PurchaseMinutesDto {
  @IsNumber()
  @Min(1, { message: 'Minutes must be at least 1' })
  minutes!: number;
}

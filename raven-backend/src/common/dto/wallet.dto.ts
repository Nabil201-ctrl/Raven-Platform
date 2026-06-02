import { IsNumber, IsString, IsOptional, Min, Max, IsNotEmpty, IsBoolean } from 'class-validator';

export class WalletAmountDto {
  @IsNumber()
  @Min(1)
  amount!: number;
}

export class MockDepositDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsNumber()
  @Min(1)
  amount!: number;
}

export class CreateWalletDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  email!: string;
}

export class WithdrawDto {
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsNumber()
  @Min(1)
  amount!: number;

  @IsString()
  @IsNotEmpty()
  bankCode!: string;

  @IsString()
  @IsNotEmpty()
  accountNumber!: string;

  @IsOptional()
  @IsString()
  narration?: string;
}

export class RateDriverDto {
  @IsNumber()
  @Min(1)
  @Max(5)
  rating!: number;
}

export class FavoriteDriverDto {
  @IsBoolean()
  isFavorite!: boolean;
}

export class PurchaseMinutesDto {
  @IsNumber()
  @Min(1)
  minutes!: number;
}

export class ResetSeatsDto {
  @IsString()
  @IsNotEmpty()
  code!: string;
}

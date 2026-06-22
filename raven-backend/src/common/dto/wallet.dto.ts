import { IsNumber, IsString, IsOptional, Min, IsNotEmpty } from 'class-validator';

export class MockDepositDto {
  @IsString()
  @IsNotEmpty({ message: 'User ID is required' })
  userId!: string;

  @IsNumber()
  @Min(1, { message: 'Deposit amount must be at least 1' })
  amount!: number;
}

export class CreateWalletDto {
  @IsString()
  @IsNotEmpty({ message: 'User ID is required' })
  userId!: string;

  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;
}

export class WithdrawDto {
  @IsString()
  @IsNotEmpty({ message: 'User ID is required' })
  userId!: string;

  @IsNumber()
  @Min(1, { message: 'Withdrawal amount must be at least 1' })
  amount!: number;

  @IsString()
  @IsNotEmpty({ message: 'Bank code is required' })
  bankCode!: string;

  @IsString()
  @IsNotEmpty({ message: 'Account number is required' })
  accountNumber!: string;

  @IsOptional()
  @IsString()
  narration?: string;
}

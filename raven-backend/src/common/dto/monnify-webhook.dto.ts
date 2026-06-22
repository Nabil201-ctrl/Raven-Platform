import { IsString, IsNotEmpty, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class MonnifyEventDataDto {
  @IsString()
  @IsNotEmpty()
  amountPaid!: string;

  @IsString()
  @IsNotEmpty()
  paymentReference!: string;

  @IsString()
  @IsNotEmpty()
  accountReference!: string;
}

export class MonnifyWebhookDto {
  @IsString()
  @IsNotEmpty()
  eventType!: string;

  @IsObject()
  @ValidateNested()
  @Type(() => MonnifyEventDataDto)
  @IsNotEmpty()
  eventData!: MonnifyEventDataDto;
}

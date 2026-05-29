import { IsString, IsNumber, IsOptional, IsArray, IsBoolean, Min, ArrayMinSize } from 'class-validator';

export class CreateBookingDto {
  @IsString()
  type!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsString()
  driverId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  seats?: number[];

  @IsOptional()
  @IsBoolean()
  isPremium?: boolean;

  @IsOptional()
  @IsString()
  route?: string;

  @IsOptional()
  @IsString()
  shuttleId?: string;

  @IsOptional()
  @IsString()
  departureTime?: string;
}

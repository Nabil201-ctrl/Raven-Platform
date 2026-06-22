import { IsString, IsNotEmpty, IsNumber, IsOptional, ValidateNested, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class RouteDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['Giri', 'Gwagwalada'])
  from!: 'Giri' | 'Gwagwalada';

  @IsString()
  @IsNotEmpty()
  @IsIn(['Giri', 'Gwagwalada'])
  to!: 'Giri' | 'Gwagwalada';
}

export class CreateShuttleDto {
  @IsString()
  @IsNotEmpty()
  shuttleCode!: string;

  @ValidateNested()
  @Type(() => RouteDto)
  @IsNotEmpty()
  route!: RouteDto;

  @IsString()
  @IsNotEmpty()
  departureTime!: string;

  @IsString()
  @IsNotEmpty()
  arrivalTime!: string;

  @IsNumber()
  @Min(1)
  totalSeats!: number;

  @IsNumber()
  @Min(0)
  pricePerSeat!: number;

  @IsNumber()
  @Min(0)
  premiumPricePerSeat!: number;

  @IsString()
  @IsNotEmpty()
  driverId!: string;
}

export class UpdateShuttleDto {
  @IsString()
  @IsOptional()
  departureTime?: string;

  @IsString()
  @IsOptional()
  arrivalTime?: string;

  @IsString()
  @IsOptional()
  @IsIn(['available', 'full', 'departed'])
  status?: 'available' | 'full' | 'departed';

  @IsString()
  @IsOptional()
  driverId?: string;
}

export class ResetSeatsDto {
  @IsString()
  @IsNotEmpty({ message: 'Shuttle/Vehicle code is required' })
  code!: string;
}


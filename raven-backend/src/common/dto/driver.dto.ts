import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsIn, Min, Max, IsOptional } from 'class-validator';

export class RegisterDriverDto {
  @IsString()
  @IsNotEmpty({ message: 'Driver name is required' })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: 'Vehicle type is required' })
  @IsIn(['shuttle', 'keke', 'bike'], { message: 'Vehicle type must be shuttle, keke, or bike' })
  vehicleType!: 'shuttle' | 'keke' | 'bike';

  @IsString()
  @IsNotEmpty({ message: 'Vehicle plate is required' })
  vehiclePlate!: string;
}

export class RateDriverDto {
  @IsNumber()
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating cannot exceed 5' })
  rating!: number;
}

export class FavoriteDriverDto {
  @IsBoolean({ message: 'isFavorite must be a boolean value' })
  isFavorite!: boolean;
}

export class RegisterCarrierDto {
  @IsString()
  @IsNotEmpty({ message: 'Route is required' })
  routeId!: string;

  @IsNumber()
  @Min(1, { message: 'Seat capacity must be at least 1' })
  @Max(30, { message: 'Seat capacity cannot exceed 30' })
  seatCapacity!: number;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class VoiceCallbackDto {
  @IsString()
  @IsNotEmpty()
  isActive!: string;

  @IsString()
  @IsNotEmpty()
  callerNumber!: string;

  @IsString()
  @IsOptional()
  sessionId?: string;

  @IsString()
  @IsOptional()
  destinationNumber?: string;
}

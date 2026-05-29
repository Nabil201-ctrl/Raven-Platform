import { IsString, IsNotEmpty } from 'class-validator';

export class SubmitComplaintDto {
  @IsString()
  @IsNotEmpty()
  bookingId!: string;

  @IsString()
  @IsNotEmpty()
  driverId!: string;

  @IsString()
  @IsNotEmpty()
  message!: string;
}

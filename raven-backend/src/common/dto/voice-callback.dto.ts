import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

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

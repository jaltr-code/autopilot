import { IsDateString, IsString } from 'class-validator';

export class CreateShiftDto {
  @IsString()
  userId!: string;

  @IsString()
  teamId!: string;

  @IsString()
  shiftTypeId!: string;

  @IsDateString()
  date!: string;
}
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateShiftPatternDto {
  @IsString()
  @IsIn(['USER', 'TEAM'])
  targetType!: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  teamId?: string;

  @IsString()
  shiftTypeId!: string;

  @IsDateString()
  startDate!: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsString()
  @IsIn(['NONE', 'DAILY', 'WEEKLY', 'EVERY_N_WEEKS'])
  recurrenceType!: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  interval?: number;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsIn(
    ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'],
    { each: true },
  )
  daysOfWeek?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
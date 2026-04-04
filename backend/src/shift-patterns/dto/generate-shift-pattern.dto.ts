import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class GenerateShiftPatternDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(30)
  daysAhead?: number = 30;
}
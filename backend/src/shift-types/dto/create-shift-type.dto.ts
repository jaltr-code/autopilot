import { IsHexColor, IsOptional, IsString, Matches, MinLength } from 'class-validator';

export class CreateShiftTypeDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'startTime must be in HH:mm format',
  })
  startTime!: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'endTime must be in HH:mm format',
  })
  endTime!: string;

  @IsOptional()
  @IsHexColor()
  color?: string;
}
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateLeaveTypeDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;
}
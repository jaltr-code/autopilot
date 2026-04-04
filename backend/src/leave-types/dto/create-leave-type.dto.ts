import { IsString, MinLength } from 'class-validator';

export class CreateLeaveTypeDto {
  @IsString()
  @MinLength(2)
  name!: string;
}
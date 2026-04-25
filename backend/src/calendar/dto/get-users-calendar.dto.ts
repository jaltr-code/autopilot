import { ArrayNotEmpty, IsArray, IsDateString, IsString } from 'class-validator';

export class GetUsersCalendarDto {
  @IsDateString()
  start!: string;

  @IsDateString()
  end!: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  userIds!: string[];
}
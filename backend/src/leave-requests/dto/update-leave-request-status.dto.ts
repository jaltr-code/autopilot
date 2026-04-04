import { IsIn, IsOptional, IsString } from 'class-validator';

export class UpdateLeaveRequestStatusDto {
  @IsString()
  @IsIn(['APPROVED', 'REJECTED'])
  status!: string;

  @IsOptional()
  @IsString()
  note?: string;
}
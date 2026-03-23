import { IsIn, IsString } from 'class-validator';

export class UpdateUserRoleDto {
  @IsString()
  @IsIn(['ADMIN', 'MANAGER', 'TEAM_LEAD', 'STAFF'])
  role!: string;
}
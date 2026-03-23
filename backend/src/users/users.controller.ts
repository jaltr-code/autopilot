import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() data: CreateUserDto, @Req() req: any) {
    return this.usersService.create(req.user.companyId, data);
  }

  @Get()
  @Roles('ADMIN', 'MANAGER', 'TEAM_LEAD', 'STAFF')
  findAll(@Req() req: any) {
    return this.usersService.findAll(
      req.user.companyId,
      req.user.sub,
      req.user.role,
    );
  }

  @Get(':userId/teams')
  @Roles('ADMIN', 'MANAGER', 'TEAM_LEAD', 'STAFF')
  findTeamsForUser(@Param('userId') userId: string, @Req() req: any) {
    return this.usersService.findTeamsForUser(
      req.user.companyId,
      req.user.sub,
      req.user.role,
      userId,
    );
  }

  @Patch(':userId/role')
  @Roles('ADMIN')
  updateRole(
    @Param('userId') userId: string,
    @Body() data: UpdateUserRoleDto,
    @Req() req: any,
  ) {
    return this.usersService.updateRole(
      req.user.companyId,
      userId,
      data.role,
    );
  }
}
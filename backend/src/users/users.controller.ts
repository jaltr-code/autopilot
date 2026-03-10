import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() data: CreateUserDto, @Req() req: any) {
    return this.usersService.create(req.user.companyId, data);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.usersService.findAll(req.user.companyId);
  }

  @Get(':userId/teams')
  findTeamsForUser(@Param('userId') userId: string, @Req() req: any) {
    return this.usersService.findTeamsForUser(req.user.companyId, userId);
  }
}
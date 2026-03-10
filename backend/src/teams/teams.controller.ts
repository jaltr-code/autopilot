import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateTeamDto } from './dto/create-team.dto';
import { TeamsService } from './teams.service';

@Controller('teams')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  create(@Body() data: CreateTeamDto, @Req() req: any) {
    return this.teamsService.create(req.user.companyId, data);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.teamsService.findAll(req.user.companyId);
  }

  @Post(':teamId/users/:userId')
  addUserToTeam(
    @Param('teamId') teamId: string,
    @Param('userId') userId: string,
    @Req() req: any,
  ) {
    return this.teamsService.addUserToTeam(req.user.companyId, teamId, userId);
  }

  @Delete(':teamId/users/:userId')
  removeUserFromTeam(
    @Param('teamId') teamId: string,
    @Param('userId') userId: string,
    @Req() req: any,
  ) {
    return this.teamsService.removeUserFromTeam(req.user.companyId, teamId, userId);
  }

  @Get(':teamId/users')
  findUsersInTeam(
    @Param('teamId') teamId: string,
    @Req() req: any,
  ) {
    return this.teamsService.findUsersInTeam(req.user.companyId, teamId);
  }
}
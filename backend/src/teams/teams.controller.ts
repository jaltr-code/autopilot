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
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() data: CreateTeamDto, @Req() req: any) {
    return this.teamsService.create(req.user.companyId, data);
  }

  @Get()
  @Roles('ADMIN')
  findAll(@Req() req: any) {
    return this.teamsService.findAll(req.user.companyId);
  }

  @Post(':teamId/users/:userId')
  @Roles('ADMIN', 'MANAGER', 'TEAM_LEAD')
  addUserToTeam(
    @Param('teamId') teamId: string,
    @Param('userId') userId: string,
    @Req() req: any,
  ) {
    return this.teamsService.addUserToTeam(
      req.user.companyId,
      req.user.sub,
      req.user.role,
      teamId,
      userId,
    );
  }

  @Delete(':teamId/users/:userId')
  @Roles('ADMIN', 'MANAGER', 'TEAM_LEAD')
  removeUserFromTeam(
    @Param('teamId') teamId: string,
    @Param('userId') userId: string,
    @Req() req: any,
  ) {
    return this.teamsService.removeUserFromTeam(
      req.user.companyId,
      req.user.sub,
      req.user.role,
      teamId,
      userId,
    );
  }

  @Get(':teamId/users')
  @Roles('ADMIN', 'MANAGER', 'TEAM_LEAD')
  findUsersInTeam(
    @Param('teamId') teamId: string,
    @Req() req: any,
  ) {
    return this.teamsService.findUsersInTeam(
      req.user.companyId,
      req.user.sub,
      req.user.role,
      teamId,
    );
  }

    @Post(':teamId/leads/:userId')
  @Roles('ADMIN')
  assignLeadToTeam(
    @Param('teamId') teamId: string,
    @Param('userId') userId: string,
    @Req() req: any,
  ) {
    return this.teamsService.assignLeadToTeam(
      req.user.companyId,
      teamId,
      userId,
    );
  }

  @Delete(':teamId/leads/:userId')
  @Roles('ADMIN')
  removeLeadFromTeam(
    @Param('teamId') teamId: string,
    @Param('userId') userId: string,
    @Req() req: any,
  ) {
    return this.teamsService.removeLeadFromTeam(
      req.user.companyId,
      teamId,
      userId,
    );
  }

  @Get(':teamId/leads')
  @Roles('ADMIN')
  findLeadsInTeam(
    @Param('teamId') teamId: string,
    @Req() req: any,
  ) {
    return this.teamsService.findLeadsInTeam(
      req.user.companyId,
      teamId,
    );
  }
}
import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateShiftDto } from './dto/create-shift.dto';
import { ShiftsService } from './shifts.service';

@Controller('shifts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER')
  create(@Body() data: CreateShiftDto, @Req() req: any) {
    return this.shiftsService.create(
      req.user.companyId,
      req.user.role,
      data,
    );
  }

  @Get('my')
  @Roles('ADMIN', 'MANAGER', 'TEAM_LEAD', 'STAFF')
  findMyShifts(@Req() req: any) {
    return this.shiftsService.findMyShifts(
      req.user.companyId,
      req.user.sub,
    );
  }

  @Get('user/:userId')
  @Roles('ADMIN', 'MANAGER', 'TEAM_LEAD', 'STAFF')
  findUserShifts(@Param('userId') userId: string, @Req() req: any) {
  return this.shiftsService.findUserShifts(
    req.user.companyId,
    req.user.sub,
    req.user.role,
    userId,
  );
}

  @Get('team/:teamId')
  @Roles('ADMIN', 'MANAGER', 'TEAM_LEAD')
  findTeamShifts(@Param('teamId') teamId: string, @Req() req: any) {
    return this.shiftsService.findTeamShifts(
      req.user.companyId,
      req.user.sub,
      req.user.role,
      teamId,
    );
  }
}
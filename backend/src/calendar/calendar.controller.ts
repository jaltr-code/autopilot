import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CalendarService } from './calendar.service';
import { GetUsersCalendarDto } from './dto/get-users-calendar.dto';

@Controller('calendar')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('team/:teamId')
  @Roles('ADMIN', 'MANAGER', 'TEAM_LEAD')
  getTeamCalendar(
    @Param('teamId') teamId: string,
    @Query('start') start: string,
    @Query('end') end: string,
    @Req() req: any,
  ) {
    return this.calendarService.getTeamCalendar(
      req.user.companyId,
      req.user.sub,
      req.user.role,
      teamId,
      start,
      end,
    );
  }

  @Post('users')
  @Roles('ADMIN', 'MANAGER', 'TEAM_LEAD')
  getUsersCalendar(@Body() data: GetUsersCalendarDto, @Req() req: any) {
    return this.calendarService.getUsersCalendar(
      req.user.companyId,
      req.user.sub,
      req.user.role,
      data,
    );
  }
}
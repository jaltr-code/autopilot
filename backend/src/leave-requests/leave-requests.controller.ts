import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { UpdateLeaveRequestStatusDto } from './dto/update-leave-request-status.dto';
import { LeaveRequestsService } from './leave-requests.service';

@Controller('leave-requests')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveRequestsController {
  constructor(private readonly leaveRequestsService: LeaveRequestsService) {}

  @Post()
  @Roles('ADMIN', 'MANAGER', 'TEAM_LEAD', 'STAFF')
  create(@Body() data: CreateLeaveRequestDto, @Req() req: any) {
    return this.leaveRequestsService.create(
      req.user.companyId,
      req.user.sub,
      data,
    );
  }

  @Get('my')
  @Roles('ADMIN', 'MANAGER', 'TEAM_LEAD', 'STAFF')
  findMy(@Req() req: any) {
    return this.leaveRequestsService.findMy(
      req.user.companyId,
      req.user.sub,
    );
  }

  @Get()
  @Roles('ADMIN', 'MANAGER', 'TEAM_LEAD')
  findAll(@Req() req: any) {
    return this.leaveRequestsService.findAll(
      req.user.companyId,
      req.user.sub,
      req.user.role,
    );
  }

  @Delete(':id')
  @Roles('ADMIN', 'MANAGER', 'TEAM_LEAD', 'STAFF')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.leaveRequestsService.remove(
      req.user.companyId,
      req.user.sub,
      id,
    );
  }

  @Patch(':id/status')
  @Roles('ADMIN', 'MANAGER', 'TEAM_LEAD')
  updateStatus(
    @Param('id') id: string,
    @Body() data: UpdateLeaveRequestStatusDto,
    @Req() req: any,
  ) {
    return this.leaveRequestsService.updateStatus(
      req.user.companyId,
      req.user.sub,
      req.user.role,
      id,
      data.status as 'APPROVED' | 'REJECTED',
      data.note,
    );
  }
}
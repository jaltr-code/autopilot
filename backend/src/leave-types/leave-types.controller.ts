import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';
import { LeaveTypesService } from './leave-types.service';

@Controller('leave-types')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LeaveTypesController {
  constructor(private readonly leaveTypesService: LeaveTypesService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() data: CreateLeaveTypeDto, @Req() req: any) {
    return this.leaveTypesService.create(req.user.companyId, data);
  }

  @Get()
  @Roles('ADMIN', 'MANAGER', 'TEAM_LEAD', 'STAFF')
  findAll(@Req() req: any) {
    return this.leaveTypesService.findAll(req.user.companyId);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(
    @Param('id') id: string,
    @Body() data: UpdateLeaveTypeDto,
    @Req() req: any,
  ) {
    return this.leaveTypesService.update(req.user.companyId, id, data);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.leaveTypesService.remove(req.user.companyId, id);
  }
}
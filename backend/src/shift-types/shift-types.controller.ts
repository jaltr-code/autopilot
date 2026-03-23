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
import { CreateShiftTypeDto } from './dto/create-shift-type.dto';
import { UpdateShiftTypeDto } from './dto/update-shift-type.dto';
import { ShiftTypesService } from './shift-types.service';

@Controller('shift-types')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ShiftTypesController {
  constructor(private readonly shiftTypesService: ShiftTypesService) {}

  @Post()
  create(@Body() data: CreateShiftTypeDto, @Req() req: any) {
    return this.shiftTypesService.create(req.user.companyId, data);
  }

  @Get()
  findAll(@Req() req: any) {
    return this.shiftTypesService.findAll(req.user.companyId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: UpdateShiftTypeDto,
    @Req() req: any,
  ) {
    return this.shiftTypesService.update(req.user.companyId, id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.shiftTypesService.remove(req.user.companyId, id);
  }
}
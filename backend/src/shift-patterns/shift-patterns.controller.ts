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
import { CreateShiftPatternDto } from './dto/create-shift-pattern.dto';
import { UpdateShiftPatternDto } from './dto/update-shift-pattern.dto';
import { ShiftPatternsService } from './shift-patterns.service';
import { GenerateShiftPatternDto } from './dto/generate-shift-pattern.dto';

@Controller('shift-patterns')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class ShiftPatternsController {
  constructor(private readonly shiftPatternsService: ShiftPatternsService) {}

  @Post()
  create(@Body() data: CreateShiftPatternDto, @Req() req: any) {
    return this.shiftPatternsService.create(req.user.companyId, data);
  }

    @Post(':id/generate')
  generate(
    @Param('id') id: string,
    @Body() data: GenerateShiftPatternDto,
    @Req() req: any,
  ) {
    return this.shiftPatternsService.generate(
      req.user.companyId,
      id,
      data.daysAhead ?? 30,
    );
  }

  @Get()
  findAll(@Req() req: any) {
    return this.shiftPatternsService.findAll(req.user.companyId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() data: UpdateShiftPatternDto,
    @Req() req: any,
  ) {
    return this.shiftPatternsService.update(req.user.companyId, id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.shiftPatternsService.remove(req.user.companyId, id);
  }
}
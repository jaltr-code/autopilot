import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShiftTypeDto } from './dto/create-shift-type.dto';
import { UpdateShiftTypeDto } from './dto/update-shift-type.dto';

@Injectable()
export class ShiftTypesService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, data: CreateShiftTypeDto) {
    const existing = await this.prisma.shiftType.findUnique({
      where: {
        companyId_name: {
          companyId,
          name: data.name,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Shift type name already exists');
    }

    return this.prisma.shiftType.create({
      data: {
        companyId,
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
        color: data.color,
      },
    });
  }

  async findAll(companyId: string) {
    return this.prisma.shiftType.findMany({
      where: {
        companyId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(companyId: string, shiftTypeId: string, data: UpdateShiftTypeDto) {
    const existingShiftType = await this.prisma.shiftType.findFirst({
      where: {
        id: shiftTypeId,
        companyId,
      },
    });

    if (!existingShiftType) {
      throw new NotFoundException('Shift type not found');
    }

    if (data.name && data.name !== existingShiftType.name) {
      const duplicate = await this.prisma.shiftType.findUnique({
        where: {
          companyId_name: {
            companyId,
            name: data.name,
          },
        },
      });

      if (duplicate) {
        throw new BadRequestException('Shift type name already exists');
      }
    }

    return this.prisma.shiftType.update({
      where: {
        id: shiftTypeId,
      },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.startTime !== undefined && { startTime: data.startTime }),
        ...(data.endTime !== undefined && { endTime: data.endTime }),
        ...(data.color !== undefined && { color: data.color }),
      },
    });
  }

  async remove(companyId: string, shiftTypeId: string) {
    const existingShiftType = await this.prisma.shiftType.findFirst({
      where: {
        id: shiftTypeId,
        companyId,
      },
    });

    if (!existingShiftType) {
      throw new NotFoundException('Shift type not found');
    }

    await this.prisma.shiftType.delete({
      where: {
        id: shiftTypeId,
      },
    });

    return {
      message: 'Shift type deleted successfully',
    };
  }
}
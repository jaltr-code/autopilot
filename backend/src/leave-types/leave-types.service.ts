import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeaveTypeDto } from './dto/create-leave-type.dto';
import { UpdateLeaveTypeDto } from './dto/update-leave-type.dto';

@Injectable()
export class LeaveTypesService {
  constructor(private prisma: PrismaService) {}

  async create(companyId: string, data: CreateLeaveTypeDto) {
    const existing = await this.prisma.leaveType.findUnique({
      where: {
        companyId_name: {
          companyId,
          name: data.name,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Leave type name already exists');
    }

    return this.prisma.leaveType.create({
      data: {
        companyId,
        name: data.name,
      },
    });
  }

  async findAll(companyId: string) {
    return this.prisma.leaveType.findMany({
      where: {
        companyId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(companyId: string, leaveTypeId: string, data: UpdateLeaveTypeDto) {
    const existingLeaveType = await this.prisma.leaveType.findFirst({
      where: {
        id: leaveTypeId,
        companyId,
      },
    });

    if (!existingLeaveType) {
      throw new NotFoundException('Leave type not found');
    }

    if (data.name && data.name !== existingLeaveType.name) {
      const duplicate = await this.prisma.leaveType.findUnique({
        where: {
          companyId_name: {
            companyId,
            name: data.name,
          },
        },
      });

      if (duplicate) {
        throw new BadRequestException('Leave type name already exists');
      }
    }

    return this.prisma.leaveType.update({
      where: {
        id: leaveTypeId,
      },
      data: {
        ...(data.name !== undefined && { name: data.name }),
      },
    });
  }

  async remove(companyId: string, leaveTypeId: string) {
    const existingLeaveType = await this.prisma.leaveType.findFirst({
      where: {
        id: leaveTypeId,
        companyId,
      },
    });

    if (!existingLeaveType) {
      throw new NotFoundException('Leave type not found');
    }

    await this.prisma.leaveType.delete({
      where: {
        id: leaveTypeId,
      },
    });

    return {
      message: 'Leave type deleted successfully',
    };
  }
}
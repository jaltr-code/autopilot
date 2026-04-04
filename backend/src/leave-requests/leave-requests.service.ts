import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LeavePolicy } from '../auth/policies/leave.policy';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';

@Injectable()
export class LeaveRequestsService {
  constructor(private prisma: PrismaService) {}

    async remove(
    companyId: string,
    currentUserId: string,
    leaveRequestId: string,
    ) {
        const leaveRequest = await this.prisma.leaveRequest.findFirst({
        where: {
            id: leaveRequestId,
            companyId,
        },
        });

        if (!leaveRequest) {
        throw new NotFoundException('Leave request not found');
        }

        if (leaveRequest.requesterId !== currentUserId) {
        throw new ForbiddenException('You can only delete your own leave requests');
        }

        if (leaveRequest.status !== 'PENDING') {
        throw new BadRequestException('Only pending leave requests can be deleted');
        }

        await this.prisma.leaveRequest.delete({
        where: {
            id: leaveRequestId,
        },
        });

        return {
        message: 'Leave request deleted successfully',
        };
    }

  async create(companyId: string, requesterId: string, data: CreateLeaveRequestDto) {
    const leaveType = await this.prisma.leaveType.findFirst({
      where: {
        id: data.leaveTypeId,
        companyId,
      },
    });

    if (!leaveType) {
      throw new NotFoundException('Leave type not found');
    }

    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (endDate < startDate) {
      throw new BadRequestException('endDate must be on or after startDate');
    }

    return this.prisma.leaveRequest.create({
      data: {
        companyId,
        requesterId,
        leaveTypeId: data.leaveTypeId,
        startDate,
        endDate,
        note: data.note,
      },
      include: {
        leaveType: true,
      },
    });
  }

  async findMy(companyId: string, requesterId: string) {
    return this.prisma.leaveRequest.findMany({
      where: {
        companyId,
        requesterId,
      },
      include: {
        leaveType: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findAll(companyId: string, currentUserId: string, currentUserRole: string) {
    if (LeavePolicy.canViewAllLeave(currentUserRole)) {
      return this.prisma.leaveRequest.findMany({
        where: {
          companyId,
        },
        include: {
          leaveType: true,
          requester: {
            include: {
              role: true,
            },
          },
          approvedBy: {
            include: {
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    if (currentUserRole === 'TEAM_LEAD') {
      const managedTeams = await this.prisma.teamManager.findMany({
        where: {
          companyId,
          userId: currentUserId,
        },
        select: {
          teamId: true,
        },
      });

      const teamIds = managedTeams.map((team) => team.teamId);

      if (teamIds.length === 0) {
        return [];
      }

      const memberships = await this.prisma.userTeam.findMany({
        where: {
          companyId,
          teamId: { in: teamIds },
        },
        select: {
          userId: true,
        },
      });

      const requesterIds = [...new Set(memberships.map((m) => m.userId))];

      if (requesterIds.length === 0) {
        return [];
      }

      return this.prisma.leaveRequest.findMany({
        where: {
          companyId,
          requesterId: { in: requesterIds },
        },
        include: {
          leaveType: true,
          requester: {
            include: {
              role: true,
            },
          },
          approvedBy: {
            include: {
              role: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }

    throw new ForbiddenException('You do not have permission to view leave requests');
    }

    private startOfDay(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    } 

    private endOfDay(date: Date) {
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
    }

    async updateStatus(
    companyId: string,
    currentUserId: string,
    currentUserRole: string,
    leaveRequestId: string,
    status: 'APPROVED' | 'REJECTED',
    note?: string,
  ) {
    if (!LeavePolicy.canApproveLeave(currentUserRole)) {
      throw new ForbiddenException('You do not have permission to update leave requests');
    }

    const leaveRequest = await this.prisma.leaveRequest.findFirst({
      where: {
        id: leaveRequestId,
        companyId,
      },
      include: {
        requester: true,
        leaveType: true,
      },
    });

    if (!leaveRequest) {
      throw new NotFoundException('Leave request not found');
    }

    if (leaveRequest.status !== 'PENDING') {
      throw new BadRequestException('Only pending leave requests can be updated');
    }

    if (currentUserRole === 'TEAM_LEAD') {
      const managedTeams = await this.prisma.teamManager.findMany({
        where: {
          companyId,
          userId: currentUserId,
        },
        select: {
          teamId: true,
        },
      });

      const teamIds = managedTeams.map((team) => team.teamId);

      const requesterMembership = await this.prisma.userTeam.findFirst({
        where: {
          companyId,
          userId: leaveRequest.requesterId,
          teamId: { in: teamIds },
        },
      });

      if (!requesterMembership) {
        throw new ForbiddenException('You do not have permission to approve this leave request');
      }
    }

    const updatedLeaveRequest = await this.prisma.leaveRequest.update({
      where: {
        id: leaveRequestId,
      },
      data: {
        status,
        approvedById: currentUserId,
        approvedAt: new Date(),
        ...(note !== undefined && { note }),
      },
      include: {
        leaveType: true,
        requester: {
          include: {
            role: true,
          },
        },
        approvedBy: {
          include: {
            role: true,
          },
        },
      },
    });

    // Only approval should affect shifts
    if (status !== 'APPROVED') {
      return {
        message: 'Leave request updated successfully',
        leaveRequest: updatedLeaveRequest,
        removedGeneratedShiftCount: 0,
        manualShiftConflictCount: 0,
        manualShiftConflicts: [],
      };
    }

    const leaveWindowStart = this.startOfDay(leaveRequest.startDate);
    const leaveWindowEnd = this.endOfDay(leaveRequest.endDate);
    const now = new Date();

    const overlappingFutureShifts = await this.prisma.shift.findMany({
      where: {
        companyId,
        userId: leaveRequest.requesterId,
        startDateTime: {
          gte: now,
          lte: leaveWindowEnd,
        },
        endDateTime: {
          gte: leaveWindowStart,
        },
      },
      include: {
        team: true,
        shiftType: true,
      },
      orderBy: {
        startDateTime: 'asc',
      },
    });

    const generatedShifts = overlappingFutureShifts.filter(
      (shift) => shift.sourcePatternId !== null,
    );

    const manualShifts = overlappingFutureShifts.filter(
      (shift) => shift.sourcePatternId === null,
    );

    if (generatedShifts.length > 0) {
      await this.prisma.shift.deleteMany({
        where: {
          id: {
            in: generatedShifts.map((shift) => shift.id),
          },
        },
      });
    }

    const manualShiftConflicts = manualShifts.map((shift) => ({
      shiftId: shift.id,
      date: shift.date.toISOString().split('T')[0],
      teamName: shift.team?.name ?? null,
      shiftTypeName: shift.shiftType.name,
      startTime: shift.shiftType.startTime,
      endTime: shift.shiftType.endTime,
      startDateTime: shift.startDateTime,
      endDateTime: shift.endDateTime,
    }));

    return {
      message: 'Leave request updated successfully',
      leaveRequest: updatedLeaveRequest,
      removedGeneratedShiftCount: generatedShifts.length,
      manualShiftConflictCount: manualShiftConflicts.length,
      manualShiftConflicts,
    };
  }
}
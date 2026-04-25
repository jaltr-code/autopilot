import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShiftDto } from './dto/create-shift.dto';

@Injectable()
export class ShiftsService {
  constructor(private prisma: PrismaService) {}

    private buildShiftDateTimes(date: string, startTime: string, endTime: string) {
    const [year, month, day] = date.split('-').map(Number);
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startDateTime = new Date(year, month - 1, day, startHour, startMinute, 0, 0);
    const endDateTime = new Date(year, month - 1, day, endHour, endMinute, 0, 0);

    // Overnight shift
    if (endDateTime <= startDateTime) {
      endDateTime.setDate(endDateTime.getDate() + 1);
    }

    return {
      startDateTime,
      endDateTime,
    };
  }

    async findUserShifts(
    companyId: string,
    currentUserId: string,
    currentUserRole: string,
    targetUserId: string,
  ) {
    const targetUser = await this.prisma.user.findFirst({
      where: {
        id: targetUserId,
        companyId,
      },
      include: {
        role: true,
      },
    });

    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    if (currentUserRole === 'STAFF' && currentUserId !== targetUserId) {
      throw new ForbiddenException('You do not have permission to view this user’s shifts');
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
          userId: targetUserId,
          teamId: { in: teamIds },
        },
      });

      if (!requesterMembership) {
        throw new ForbiddenException('You do not have permission to view this user’s shifts');
      }
    }

    return this.prisma.shift.findMany({
      where: {
        companyId,
        userId: targetUserId,
      },
      include: {
        team: true,
        shiftType: true,
      },
      orderBy: {
        startDateTime: 'asc',
      },
    });
  }

  private timeRangesOverlap(
    startA: Date,
    endA: Date,
    startB: Date,
    endB: Date,
  ): boolean {
    return startA < endB && endA > startB;
  }

  async create(
    companyId: string,
    currentUserRole: string,
    data: CreateShiftDto,
  ) {
    if (currentUserRole !== 'ADMIN' && currentUserRole !== 'MANAGER') {
      throw new ForbiddenException('You do not have permission to assign shifts');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: data.userId,
        companyId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const team = await this.prisma.team.findFirst({
      where: {
        id: data.teamId,
        companyId,
      },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const shiftType = await this.prisma.shiftType.findFirst({
      where: {
        id: data.shiftTypeId,
        companyId,
      },
    });

    if (!shiftType) {
      throw new NotFoundException('Shift type not found');
    }

    const membership = await this.prisma.userTeam.findFirst({
      where: {
        companyId,
        userId: data.userId,
        teamId: data.teamId,
      },
    });

    if (!membership) {
      throw new BadRequestException('User does not belong to this team');
    }

    const { startDateTime, endDateTime } = this.buildShiftDateTimes(
      data.date,
      shiftType.startTime,
      shiftType.endTime,
    );

    const existingShifts = await this.prisma.shift.findMany({
      where: {
        companyId,
        userId: data.userId,
      },
      include: {
        team: true,
        shiftType: true,
      },
      orderBy: {
        startDateTime: 'asc',
      },
    });

    const conflictingShift = existingShifts.find((shift) =>
      this.timeRangesOverlap(
        startDateTime,
        endDateTime,
        shift.startDateTime,
        shift.endDateTime,
      ),
    );

    if (conflictingShift) {
      throw new BadRequestException(
        `The staff member already has a shift during this time (${conflictingShift.shiftType.startTime} - ${conflictingShift.shiftType.endTime}${conflictingShift.team ? ` ${conflictingShift.team.name}` : ''})`,
      );
    }

    return this.prisma.shift.create({
      data: {
        companyId,
        userId: data.userId,
        teamId: data.teamId,
        shiftTypeId: data.shiftTypeId,
        date: new Date(data.date),
        startDateTime,
        endDateTime,
      },
      include: {
        user: {
          include: {
            role: true,
          },
        },
        team: true,
        shiftType: true,
      },
    });
  }

  async findMyShifts(companyId: string, userId: string) {
    return this.prisma.shift.findMany({
      where: {
        companyId,
        userId,
      },
      include: {
        team: true,
        shiftType: true,
      },
      orderBy: {
        date: 'asc',
      },
    });
  }

  async findTeamShifts(
    companyId: string,
    currentUserId: string,
    currentUserRole: string,
    teamId: string,
  ) {
    const team = await this.prisma.team.findFirst({
      where: {
        id: teamId,
        companyId,
      },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    if (currentUserRole === 'STAFF') {
      throw new ForbiddenException('You do not have permission to view team shifts');
    }

    if (currentUserRole === 'TEAM_LEAD') {
      const leadAssignment = await this.prisma.teamManager.findFirst({
        where: {
          companyId,
          userId: currentUserId,
          teamId,
        },
      });

      if (!leadAssignment) {
        throw new ForbiddenException('You do not have permission to view this team');
      }
    }

    return this.prisma.shift.findMany({
      where: {
        companyId,
        teamId,
      },
      include: {
        user: {
          include: {
            role: true,
          },
        },
        shiftType: true,
      },
      orderBy: {
        date: 'asc',
      },
    });
  }
}
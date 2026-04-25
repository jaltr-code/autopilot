import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetUsersCalendarDto } from './dto/get-users-calendar.dto';

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  private startOfDay(date: string) {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  }

  private endOfDay(date: string) {
    const d = new Date(date);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
  }

  private async assertCanViewTeam(
    companyId: string,
    currentUserId: string,
    currentUserRole: string,
    teamId: string,
  ) {
    if (currentUserRole === 'ADMIN' || currentUserRole === 'MANAGER') {
      return;
    }

    if (currentUserRole === 'TEAM_LEAD') {
      const managed = await this.prisma.teamManager.findFirst({
        where: {
          companyId,
          userId: currentUserId,
          teamId,
        },
      });

      if (!managed) {
        throw new ForbiddenException('You do not manage this team');
      }

      return;
    }

    throw new ForbiddenException('You do not have permission to view this calendar');
  }

  private async buildCalendarForUsers(
    companyId: string,
    userIds: string[],
    start: Date,
    end: Date,
  ) {
    const users = await this.prisma.user.findMany({
    where: {
            companyId,
            id: { in: userIds },
        },
        include: {
            role: true,
            userTeams: {
            include: {
                team: true,
            },
            },
        },
        orderBy: {
            firstName: 'asc',
        },
    });

    const shifts = await this.prisma.shift.findMany({
      where: {
        companyId,
        userId: { in: userIds },
        startDateTime: {
          lte: end,
        },
        endDateTime: {
          gte: start,
        },
      },
      include: {
        shiftType: true,
        team: true,
      },
      orderBy: {
        startDateTime: 'asc',
      },
    });

    const leaveRequests = await this.prisma.leaveRequest.findMany({
      where: {
        companyId,
        requesterId: { in: userIds },
        status: 'APPROVED',
        startDate: {
          lte: end,
        },
        endDate: {
          gte: start,
        },
      },
      include: {
        leaveType: true,
      },
      orderBy: {
        startDate: 'asc',
      },
    });

    return users.map((user) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role.name,
      teams: user.userTeams.map((membership) => ({
        id: membership.team.id,
        name: membership.team.name,
      })),
      shifts: shifts
        .filter((shift) => shift.userId === user.id)
        .map((shift) => ({
          id: shift.id,
          date: shift.date,
          startDateTime: shift.startDateTime,
          endDateTime: shift.endDateTime,
          shiftType: {
            id: shift.shiftType.id,
            name: shift.shiftType.name,
          },
          team: shift.team
            ? {
                id: shift.team.id,
                name: shift.team.name,
              }
            : null,
          isGenerated: shift.sourcePatternId !== null,
        })),
      leave: leaveRequests
        .filter((leave) => leave.requesterId === user.id)
        .map((leave) => ({
          id: leave.id,
          startDate: leave.startDate,
          endDate: leave.endDate,
          leaveType: {
            id: leave.leaveType.id,
            name: leave.leaveType.name,
          },
          note: leave.note,
        })),
    }));
  }

  async getTeamCalendar(
    companyId: string,
    currentUserId: string,
    currentUserRole: string,
    teamId: string,
    start: string,
    end: string,
  ) {
    await this.assertCanViewTeam(
      companyId,
      currentUserId,
      currentUserRole,
      teamId,
    );

    const team = await this.prisma.team.findFirst({
      where: {
        id: teamId,
        companyId,
      },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const memberships = await this.prisma.userTeam.findMany({
      where: {
        companyId,
        teamId,
      },
      select: {
        userId: true,
      },
    });

    const userIds = memberships.map((m) => m.userId);

    return {
      team: {
        id: team.id,
        name: team.name,
      },
      range: {
        start,
        end,
      },
      users: await this.buildCalendarForUsers(
        companyId,
        userIds,
        this.startOfDay(start),
        this.endOfDay(end),
      ),
    };
  }

  async getUsersCalendar(
    companyId: string,
    currentUserId: string,
    currentUserRole: string,
    data: GetUsersCalendarDto,
  ) {
    let allowedUserIds = data.userIds;

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

      const memberships = await this.prisma.userTeam.findMany({
        where: {
          companyId,
          teamId: { in: teamIds },
        },
        select: {
          userId: true,
        },
      });

      const manageableUserIds = new Set(memberships.map((m) => m.userId));

      allowedUserIds = data.userIds.filter((id) => manageableUserIds.has(id));

      if (allowedUserIds.length === 0) {
        throw new ForbiddenException('You do not have permission to view these users');
      }
    }

    if (
      currentUserRole !== 'ADMIN' &&
      currentUserRole !== 'MANAGER' &&
      currentUserRole !== 'TEAM_LEAD'
    ) {
      throw new ForbiddenException('You do not have permission to view this calendar');
    }

    return {
      range: {
        start: data.start,
        end: data.end,
      },
      users: await this.buildCalendarForUsers(
        companyId,
        allowedUserIds,
        this.startOfDay(data.start),
        this.endOfDay(data.end),
      ),
    };
  }
}
import { TeamPolicy } from '../auth/policies/team.policy';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService
    , private auditService: AuditService
  ) {}

    async assignLeadToTeam(companyId: string, currentUserId: string, teamId: string, userId: string) {
    const team = await this.prisma.team.findFirst({
      where: {
        id: teamId,
        companyId,
      },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        companyId,
      },
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role.name !== 'TEAM_LEAD') {
      throw new BadRequestException('Only TEAM_LEAD users can be assigned as team leads');
    }

    const existingAssignment = await this.prisma.teamManager.findFirst({
      where: {
        companyId,
        teamId,
        userId,
      },
    });

    if (existingAssignment) {
      throw new BadRequestException('User is already assigned as a lead for this team');
    }

    await this.auditService.log({
      companyId,
      userId: currentUserId, // who performed the action
      action: 'USER_ADDED_TO_TEAM', // or better: TEAM_LEAD_ASSIGNED (see below)
      entityType: 'Team',
      entityId: teamId,
      metadata: {
        assignedUserId: userId,
        role: 'TEAM_LEAD',
      },
    });

    return this.prisma.teamManager.create({
      data: {
        companyId,
        teamId,
        userId,
      },
      include: {
        user: {
          include: {
            role: true,
          },
        },
        team: true,
      },
    });
  }

  async removeLeadFromTeam(companyId: string, currentUserId: string, teamId: string, userId: string) {
    const assignment = await this.prisma.teamManager.findFirst({
      where: {
        companyId,
        teamId,
        userId,
      },
    });

    if (!assignment) {
      throw new NotFoundException('Team lead assignment not found');
    }

    await this.prisma.teamManager.delete({
      where: {
        id: assignment.id,
      },
    });

    await this.auditService.log({
      companyId,
      userId: currentUserId,
      action: 'USER_REMOVED_FROM_TEAM', // or TEAM_LEAD_REMOVED
      entityType: 'Team',
      entityId: teamId,
      metadata: {
        removedUserId: userId,
        role: 'TEAM_LEAD',
      },
    });

    return {
      message: 'Team lead removed successfully',
    };
  }

  async findLeadsInTeam(companyId: string, teamId: string) {
    const team = await this.prisma.team.findFirst({
      where: {
        id: teamId,
        companyId,
      },
    });

    if (!team) {
      throw new NotFoundException('Team not found');
    }

    const assignments = await this.prisma.teamManager.findMany({
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
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return assignments.map((assignment) => ({
      id: assignment.user.id,
      email: assignment.user.email,
      firstName: assignment.user.firstName,
      lastName: assignment.user.lastName,
      role: assignment.user.role.name,
      assignedAt: assignment.createdAt,
    }));
  }

    private async assertCanManageTeam(
    companyId: string,
    currentUserId: string,
    currentUserRole: string,
    teamId: string,
  ) {
    const managedTeams = await this.prisma.teamManager.findMany({
      where: {
        companyId,
        userId: currentUserId,
      },
      select: {
        teamId: true,
      },
    });

    const managedTeamIds = managedTeams.map((team) => team.teamId);

    const allowed = TeamPolicy.canManageTeam(
      currentUserRole,
      managedTeamIds,
      teamId,
    );

    if (!allowed) {
      throw new ForbiddenException(
        'You do not have permission to manage this team',
      );
    }
  }

  async create(companyId: string, data: CreateTeamDto) {
    const existingTeam = await this.prisma.team.findUnique({
      where: {
        companyId_name: {
          companyId,
          name: data.name,
        },
      },
    });

    if (existingTeam) {
      throw new BadRequestException('Team name already exists');
    }

    return this.prisma.team.create({
      data: {
        companyId,
        name: data.name,
      },
    });
  }

  async findAll(companyId: string) {
    return this.prisma.team.findMany({
      where: { companyId },
      orderBy: { createdAt: 'desc' },
    });
  }

    async addUserToTeam(
    companyId: string,
    currentUserId: string,
    currentUserRole: string,
    teamId: string,
    userId: string,
  ) {
    await this.assertCanManageTeam(
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

    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        companyId,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existingMembership = await this.prisma.userTeam.findFirst({
      where: {
        companyId,
        teamId,
        userId,
      },
    });

    if (existingMembership) {
      throw new BadRequestException('User is already in this team');
    }
    
    await this.auditService.log({
      companyId,
      userId: currentUserId,
      action: 'USER_ADDED_TO_TEAM',
      entityType: 'Team',
      entityId: teamId,
      metadata: {
        addedUserId: userId,
      },
    });

    return this.prisma.userTeam.create({
      data: {
        companyId,
        teamId,
        userId,
      },
      include: {
        user: {
          include: {
            role: true,
          },
        },
        team: true,
      },
    });
  }

  async removeUserFromTeam(
      companyId: string,
      currentUserId: string,
      currentUserRole: string,
      teamId: string,
      userId: string,
    ) {
      await this.assertCanManageTeam(
        companyId,
        currentUserId,
        currentUserRole,
        teamId,
      );

      const membership = await this.prisma.userTeam.findFirst({
        where: {
          companyId,
          teamId,
          userId,
        },
      });

      if (!membership) {
        throw new NotFoundException('User is not in this team');
      }

      const now = new Date();

      const futureGeneratedTeamShifts = await this.prisma.shift.findMany({
        where: {
          companyId,
          teamId,
          userId,
          startDateTime: {
            gte: now,
          },
          sourcePatternId: {
            not: null,
          },
        },
        include: {
          sourcePattern: true,
          shiftType: true,
          team: true,
        },
      });

      const removableShiftIds = futureGeneratedTeamShifts
        .filter(
          (shift) =>
            shift.sourcePattern &&
            shift.sourcePattern.targetType === 'TEAM' &&
            shift.sourcePattern.teamId === teamId,
        )
        .map((shift) => shift.id);

      if (removableShiftIds.length > 0) {
        await this.prisma.shift.deleteMany({
          where: {
            id: {
              in: removableShiftIds,
            },
          },
        });
      }

      await this.prisma.userTeam.delete({
        where: {
          id: membership.id,
        },
      });

      await this.auditService.log({
        companyId,
        userId: currentUserId,
        action: 'USER_REMOVED_FROM_TEAM',
        entityType: 'Team',
        entityId: teamId,
        metadata: {
          removedUserId: userId,
          removedFutureGeneratedShiftCount: removableShiftIds.length,
        },
      });

      return {
        message: 'User removed from team successfully',
        removedFutureGeneratedShiftCount: removableShiftIds.length,
      };
    }

    async findUsersInTeam(
    companyId: string,
    currentUserId: string,
    currentUserRole: string,
    teamId: string,
  ) {
    await this.assertCanManageTeam(
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
      include: {
        user: {
          include: {
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return memberships.map((membership) => ({
      id: membership.user.id,
      email: membership.user.email,
      firstName: membership.user.firstName,
      lastName: membership.user.lastName,
      role: membership.user.role.name,
      isActive: membership.user.isActive,
      joinedTeamAt: membership.createdAt,
    }));
  }
}
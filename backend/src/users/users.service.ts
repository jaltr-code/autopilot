import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RoleName } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ForbiddenException } from '@nestjs/common';
import { UserPolicy } from '../auth/policies/user.policy';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

    async updateRole(
    companyId: string,
    targetUserId: string,
    newRoleName: string,
  ) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: targetUserId,
        companyId,
      },
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const newRole = await this.prisma.role.findFirst({
      where: {
        companyId,
        name: newRoleName as RoleName,
      },
    });

    if (!newRole) {
      throw new BadRequestException('Invalid role');
    }

    const oldRoleName = user.role.name;

    // Prevent no-op updates
    if (oldRoleName === newRoleName) {
      return {
        message: 'User already has this role',
      };
    }

    // Update role
    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        roleId: newRole.id,
      },
    });

    // Option B: clean up TeamManager on demotion
    if (oldRoleName === 'MANAGER' && newRoleName !== 'MANAGER') {
      await this.prisma.teamManager.deleteMany({
        where: {
          companyId,
          userId: user.id,
        },
      });
    }

    return {
      message: 'User role updated successfully',
      userId: user.id,
      oldRole: oldRoleName,
      newRole: newRoleName,
    };
  }

  async create(companyId: string, data: CreateUserDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        companyId,
        email: data.email,
      },
    });

    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }

    const role = await this.prisma.role.findFirst({
      where: {
        companyId,
        name: data.role as RoleName,
      },
    });

    if (!role) {
      throw new BadRequestException('Invalid role');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        companyId,
        roleId: role.id,
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
      },
      include: {
        role: true,
      },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      companyId: user.companyId,
      role: user.role.name,
      createdAt: user.createdAt,
    };
  }

  async findAll(companyId: string, currentUserId: string, currentUserRole: string) {
    if (UserPolicy.canViewAllUsers(currentUserRole)) {
      const users = await this.prisma.user.findMany({
        where: {
          companyId,
        },
        include: {
          role: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return users.map((user) => ({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        companyId: user.companyId,
        role: user.role.name,
        isActive: user.isActive,
        createdAt: user.createdAt,
      }));
    }

    if (currentUserRole === 'TEAM_LEAD') {
      const managedTeamIds = await this.prisma.teamManager.findMany({
        where: {
          companyId,
          userId: currentUserId,
        },
        select: {
          teamId: true,
        },
      });

      const teamIds = managedTeamIds.map((t) => t.teamId);

      if (teamIds.length === 0) {
        return [];
      }

      const memberships = await this.prisma.userTeam.findMany({
        where: {
          companyId,
          teamId: { in: teamIds },
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

      const uniqueUsers = new Map<string, any>();

      for (const membership of memberships) {
        uniqueUsers.set(membership.user.id, {
          id: membership.user.id,
          email: membership.user.email,
          firstName: membership.user.firstName,
          lastName: membership.user.lastName,
          companyId: membership.user.companyId,
          role: membership.user.role.name,
          isActive: membership.user.isActive,
          createdAt: membership.user.createdAt,
        });
      }

      return Array.from(uniqueUsers.values());
    }

    if (currentUserRole === 'STAFF') {
      const user = await this.prisma.user.findFirst({
        where: {
          id: currentUserId,
          companyId,
        },
        include: {
          role: true,
        },
      });

      if (!user) {
        throw new BadRequestException('User not found');
      }

      return [
        {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          companyId: user.companyId,
          role: user.role.name,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
      ];
    }

    throw new ForbiddenException('You do not have permission to view users');
  }

  async findTeamsForUser(
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
    });

    if (!targetUser) {
      throw new BadRequestException('User not found');
    }

    let sharedManagedTeam = false;

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

      const managedTeamIds = managedTeams.map((team) => team.teamId);

      if (managedTeamIds.length > 0) {
        const sharedMembership = await this.prisma.userTeam.findFirst({
          where: {
            companyId,
            userId: targetUserId,
            teamId: {
              in: managedTeamIds,
            },
          },
        });

        sharedManagedTeam = !!sharedMembership;
      }
    }

    const allowed = UserPolicy.canViewSpecificUser(
      currentUserRole,
      currentUserId,
      targetUserId,
      sharedManagedTeam,
    );

    if (!allowed) {
      throw new ForbiddenException(
        'You do not have permission to view this user',
      );
    }

    const memberships = await this.prisma.userTeam.findMany({
      where: {
        companyId,
        userId: targetUserId,
      },
      include: {
        team: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return memberships.map((membership) => ({
      id: membership.team.id,
      name: membership.team.name,
      joinedAt: membership.createdAt,
    }));
  }
}
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

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

  async addUserToTeam(companyId: string, teamId: string, userId: string) {
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

  async removeUserFromTeam(companyId: string, teamId: string, userId: string) {
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

    await this.prisma.userTeam.delete({
      where: {
        id: membership.id,
      },
    });

    return {
      message: 'User removed from team successfully',
    };
  }

  async findUsersInTeam(companyId: string, teamId: string) {
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
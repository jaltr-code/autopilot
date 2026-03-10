import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RoleName } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

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

  async findAll(companyId: string) {
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

  async findTeamsForUser(companyId: string, userId: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        companyId,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const memberships = await this.prisma.userTeam.findMany({
      where: {
        companyId,
        userId,
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
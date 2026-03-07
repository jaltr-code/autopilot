import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RoleName } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async signup(data: SignupDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: {
        email: data.email,
      },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const existingCompany = await this.prisma.company.findUnique({
      where: {
        slug: data.companySlug,
      },
    });

    if (existingCompany) {
      throw new BadRequestException('Company slug already in use');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const result = await this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: data.companyName,
          slug: data.companySlug,
        },
      });

      const staffRole = await tx.role.create({
        data: {
          companyId: company.id,
          name: RoleName.STAFF,
        },
      });

      await tx.role.create({
        data: {
          companyId: company.id,
          name: RoleName.TEAM_LEAD,
        },
      });

      await tx.role.create({
        data: {
          companyId: company.id,
          name: RoleName.MANAGER,
        },
      });

      const adminRole = await tx.role.create({
        data: {
          companyId: company.id,
          name: RoleName.ADMIN,
        },
      });

      const user = await tx.user.create({
        data: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          passwordHash,
          companyId: company.id,
          roleId: adminRole.id,
        },
      });

      return {
        company,
        user,
      };
    });

    return {
      message: 'Signup successful',
      companyId: result.company.id,
      userId: result.user.id,
    };
  }
}
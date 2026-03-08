import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RoleName } from '../../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async signup(data: SignupDto) {
    const existingUser = await this.prisma.user.findFirst({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const existingCompany = await this.prisma.company.findUnique({
      where: { slug: data.companySlug },
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

      await tx.role.create({
        data: { companyId: company.id, name: RoleName.STAFF },
      });

      await tx.role.create({
        data: { companyId: company.id, name: RoleName.TEAM_LEAD },
      });

      await tx.role.create({
        data: { companyId: company.id, name: RoleName.MANAGER },
      });

      const adminRole = await tx.role.create({
        data: { companyId: company.id, name: RoleName.ADMIN },
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
        include: {
          company: true,
          role: true,
        },
      });

      return { company, user };
    });

    const token = await this.signToken(result.user.id, result.user.email, result.user.companyId);

    return {
      message: 'Signup successful',
      companyId: result.company.id,
      userId: result.user.id,
      accessToken: token,
    };
  }

  async login(data: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: { email: data.email },
      include: {
        company: true,
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatches = await bcrypt.compare(data.password, user.passwordHash);

    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = await this.signToken(user.id, user.email, user.companyId);

    return {
      message: 'Login successful',
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        companyId: user.companyId,
        companyName: user.company.name,
        role: user.role.name,
      },
    };
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        company: true,
        role: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      companyId: user.companyId,
      companyName: user.company.name,
      role: user.role.name,
    };
  }

  private async signToken(userId: string, email: string, companyId: string) {
    return this.jwtService.signAsync({
      sub: userId,
      email,
      companyId,
    });
  }
}
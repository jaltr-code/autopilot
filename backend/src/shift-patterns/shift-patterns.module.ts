import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { ShiftPatternsController } from './shift-patterns.controller';
import { ShiftPatternsService } from './shift-patterns.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret-change-this',
      signOptions: { expiresIn: '1d' },
    }),
    AuditModule
  ],
  controllers: [ShiftPatternsController],
  providers: [ShiftPatternsService],
})
export class ShiftPatternsModule {}
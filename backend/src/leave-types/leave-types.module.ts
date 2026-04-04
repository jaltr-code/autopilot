import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { LeaveTypesController } from './leave-types.controller';
import { LeaveTypesService } from './leave-types.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret-change-this',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [LeaveTypesController],
  providers: [LeaveTypesService],
})
export class LeaveTypesModule {}
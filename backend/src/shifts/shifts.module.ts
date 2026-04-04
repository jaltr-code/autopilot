import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { ShiftsController } from './shifts.controller';
import { ShiftsService } from './shifts.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret-change-this',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [ShiftsController],
  providers: [ShiftsService],
})
export class ShiftsModule {}
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { ShiftTypesController } from './shift-types.controller';
import { ShiftTypesService } from './shift-types.service';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'dev-secret-change-this',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [ShiftTypesController],
  providers: [ShiftTypesService],
})
export class ShiftTypesModule {}
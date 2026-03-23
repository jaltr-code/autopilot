import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TeamsModule } from './teams/teams.module';
import { UsersModule } from './users/users.module';
import { ShiftTypesModule } from './shift-types/shift-types.module';

@Module({
  imports: [PrismaModule, AuthModule, TeamsModule, UsersModule, ShiftTypesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TeamsModule } from './teams/teams.module';
import { UsersModule } from './users/users.module';
import { ShiftTypesModule } from './shift-types/shift-types.module';
import { ShiftsModule } from './shifts/shifts.module';
import { ShiftPatternsModule } from './shift-patterns/shift-patterns.module';
import { LeaveRequestsModule } from './leave-requests/leave-requests.module';
import { LeaveTypesModule } from './leave-types/leave-types.module';
import { CalendarModule } from './calendar/calendar.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [PrismaModule, AuthModule, TeamsModule, UsersModule, ShiftTypesModule, ShiftsModule, ShiftPatternsModule, LeaveRequestsModule, LeaveTypesModule, CalendarModule, AuditModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
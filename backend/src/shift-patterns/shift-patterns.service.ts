import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShiftPatternDto } from './dto/create-shift-pattern.dto';
import { UpdateShiftPatternDto } from './dto/update-shift-pattern.dto';

@Injectable()
export class ShiftPatternsService {
  constructor(private prisma: PrismaService) {}

  private validateTargetFields(targetType: string, userId?: string, teamId?: string) {
    if (targetType === 'USER') {
      if (!userId) {
        throw new BadRequestException('userId is required when targetType is USER');
      }
      if (teamId) {
        throw new BadRequestException('teamId must not be provided when targetType is USER');
      }
    }

    if (targetType === 'TEAM') {
      if (!teamId) {
        throw new BadRequestException('teamId is required when targetType is TEAM');
      }
      if (userId) {
        throw new BadRequestException('userId must not be provided when targetType is TEAM');
      }
    }
  }

    private buildShiftDateTimes(date: Date, startTime: string, endTime: string) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startDateTime = new Date(year, month, day, startHour, startMinute, 0, 0);
    const endDateTime = new Date(year, month, day, endHour, endMinute, 0, 0);

    if (endDateTime <= startDateTime) {
      endDateTime.setDate(endDateTime.getDate() + 1);
    }

    return {
      startDateTime,
      endDateTime,
    };
  }

  private timeRangesOverlap(
    startA: Date,
    endA: Date,
    startB: Date,
    endB: Date,
  ): boolean {
    return startA < endB && endA > startB;
  }

  private normalizeDate(date: Date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  }

  private addDays(date: Date, days: number) {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + days);
    return copy;
  }

  private getDayName(date: Date): string {
    const names = [
      'SUNDAY',
      'MONDAY',
      'TUESDAY',
      'WEDNESDAY',
      'THURSDAY',
      'FRIDAY',
      'SATURDAY',
    ];

    return names[date.getDay()];
  }

  private getWeekDifference(from: Date, to: Date): number {
    const msPerWeek = 7 * 24 * 60 * 60 * 1000;
    return Math.floor((this.normalizeDate(to).getTime() - this.normalizeDate(from).getTime()) / msPerWeek);
  }

  private getOccurrenceDates(
    startDate: Date,
    endDate: Date,
    recurrenceType: string,
    interval: number | null,
    daysOfWeek: string[],
  ): Date[] {
    const dates: Date[] = [];
    let cursor = this.normalizeDate(startDate);
    const normalizedEnd = this.normalizeDate(endDate);

    while (cursor <= normalizedEnd) {
      const dayName = this.getDayName(cursor);

      if (recurrenceType === 'NONE') {
        if (cursor.getTime() === this.normalizeDate(startDate).getTime()) {
          dates.push(new Date(cursor));
        }
        break;
      }

      if (recurrenceType === 'DAILY') {
        dates.push(new Date(cursor));
      }

      if (recurrenceType === 'WEEKLY') {
        if (daysOfWeek.includes(dayName)) {
          dates.push(new Date(cursor));
        }
      }

      if (recurrenceType === 'EVERY_N_WEEKS') {
        const weekDiff = this.getWeekDifference(startDate, cursor);
        const everyN = interval ?? 1;

        if (weekDiff % everyN === 0 && daysOfWeek.includes(dayName)) {
          dates.push(new Date(cursor));
        }
      }

      cursor = this.addDays(cursor, 1);
    }

    return dates;
  }

    async generate(companyId: string, patternId: string, daysAhead: number) {
    const pattern = await this.prisma.shiftPattern.findFirst({
      where: {
        id: patternId,
        companyId,
      },
      include: {
        shiftType: true,
        team: true,
        user: true,
      },
    });

    if (!pattern) {
      throw new NotFoundException('Shift pattern not found');
    }

    if (!pattern.isActive) {
      throw new BadRequestException('Cannot generate shifts for an inactive pattern');
    }

    const today = this.normalizeDate(new Date());
    const windowEnd = this.addDays(today, daysAhead);

    const effectiveStart = this.normalizeDate(
      pattern.startDate > today ? pattern.startDate : today,
    );

    const effectiveEnd = pattern.endDate
      ? this.normalizeDate(pattern.endDate < windowEnd ? pattern.endDate : windowEnd)
      : windowEnd;

    if (effectiveStart > effectiveEnd) {
      return {
        message: 'No shifts to generate for the selected window',
        createdCount: 0,
        patternConflictCount: 0,
        manualExclusionCount: 0,
        leaveConflictCount: 0,
        results: {
          created: [],
          patternConflicts: [],
          manualExclusions: [],
          leaveConflicts: [],
        },
      };
    }

    const occurrenceDates = this.getOccurrenceDates(
      effectiveStart,
      effectiveEnd,
      pattern.recurrenceType,
      pattern.interval,
      pattern.daysOfWeek,
    );

    let targetUsers: { id: string }[] = [];

    if (pattern.targetType === 'USER') {
      if (!pattern.userId) {
        throw new BadRequestException('USER pattern is missing userId');
      }

      targetUsers = [{ id: pattern.userId }];
    }

    if (pattern.targetType === 'TEAM') {
      if (!pattern.teamId) {
        throw new BadRequestException('TEAM pattern is missing teamId');
      }

      const memberships = await this.prisma.userTeam.findMany({
        where: {
          companyId,
          teamId: pattern.teamId,
        },
        select: {
          userId: true,
        },
      });

      targetUsers = memberships.map((m) => ({ id: m.userId }));
    }

    const created: any[] = [];
    const patternConflicts: any[] = [];
    const manualExclusions: any[] = [];
    const leaveConflicts: any[] = [];

    for (const occurrenceDate of occurrenceDates) {
      for (const targetUser of targetUsers) {
        const { startDateTime, endDateTime } = this.buildShiftDateTimes(
          occurrenceDate,
          pattern.shiftType.startTime,
          pattern.shiftType.endTime,
        );

        const existingShifts = await this.prisma.shift.findMany({
          where: {
            companyId,
            userId: targetUser.id,
          },
          include: {
            team: true,
            shiftType: true,
          },
        });

        const conflictingShift = existingShifts.find((shift) =>
          this.timeRangesOverlap(
            startDateTime,
            endDateTime,
            shift.startDateTime,
            shift.endDateTime,
          ),
        );

        if (conflictingShift) {
          const payload = {
            userId: targetUser.id,
            date: occurrenceDate.toISOString().split('T')[0],
            details: {
              shiftId: conflictingShift.id,
              teamName: conflictingShift.team?.name ?? null,
              shiftTypeName: conflictingShift.shiftType.name,
              startTime: conflictingShift.shiftType.startTime,
              endTime: conflictingShift.shiftType.endTime,
            },
          };

          if (conflictingShift.sourcePatternId) {
            patternConflicts.push({
              ...payload,
              reason: 'PATTERN_CONFLICT',
            });
          } else {
            manualExclusions.push({
              ...payload,
              reason: 'MANUAL_EXCLUSION',
            });
          }

          continue;
        }

        const approvedLeave = await this.prisma.leaveRequest.findFirst({
          where: {
            companyId,
            requesterId: targetUser.id,
            status: 'APPROVED',
            startDate: {
              lte: endDateTime,
            },
            endDate: {
              gte: startDateTime,
            },
          },
          include: {
            leaveType: true,
          },
        });

        if (approvedLeave) {
          leaveConflicts.push({
            userId: targetUser.id,
            date: occurrenceDate.toISOString().split('T')[0],
            reason: 'APPROVED_LEAVE_CONFLICT',
            details: {
              leaveRequestId: approvedLeave.id,
              leaveType: approvedLeave.leaveType.name,
              status: approvedLeave.status,
            },
          });

          continue;
        }

        const shift = await this.prisma.shift.create({
          data: {
            companyId,
            userId: targetUser.id,
            teamId: pattern.teamId ?? null,
            shiftTypeId: pattern.shiftTypeId,
            sourcePatternId: pattern.id,
            date: occurrenceDate,
            startDateTime,
            endDateTime,
          },
        });

        created.push({
          id: shift.id,
          userId: targetUser.id,
          date: occurrenceDate.toISOString().split('T')[0],
        });
      }
    }

    return {
      message: 'Shift generation completed',
      createdCount: created.length,
      patternConflictCount: patternConflicts.length,
      manualExclusionCount: manualExclusions.length,
      leaveConflictCount: leaveConflicts.length,
      results: {
        created,
        patternConflicts,
        manualExclusions,
        leaveConflicts,
      },
    };
  }

  private validateRecurrence(
    recurrenceType: string,
    interval?: number,
    daysOfWeek?: string[],
  ) {
    if (recurrenceType === 'EVERY_N_WEEKS' && (!interval || interval < 1)) {
      throw new BadRequestException('interval must be provided and >= 1 for EVERY_N_WEEKS');
    }

    if (
      (recurrenceType === 'WEEKLY' || recurrenceType === 'EVERY_N_WEEKS') &&
      (!daysOfWeek || daysOfWeek.length === 0)
    ) {
      throw new BadRequestException('daysOfWeek is required for WEEKLY and EVERY_N_WEEKS patterns');
    }
  }

  async create(companyId: string, data: CreateShiftPatternDto) {
    this.validateTargetFields(data.targetType, data.userId, data.teamId);
    this.validateRecurrence(data.recurrenceType, data.interval, data.daysOfWeek);

    const shiftType = await this.prisma.shiftType.findFirst({
      where: {
        id: data.shiftTypeId,
        companyId,
      },
    });

    if (!shiftType) {
      throw new NotFoundException('Shift type not found');
    }

    if (data.userId) {
      const user = await this.prisma.user.findFirst({
        where: {
          id: data.userId,
          companyId,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }
    }

    if (data.teamId) {
      const team = await this.prisma.team.findFirst({
        where: {
          id: data.teamId,
          companyId,
        },
      });

      if (!team) {
        throw new NotFoundException('Team not found');
      }
    }

    return this.prisma.shiftPattern.create({
      data: {
        companyId,
        targetType: data.targetType as any,
        userId: data.userId,
        teamId: data.teamId,
        shiftTypeId: data.shiftTypeId,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
        recurrenceType: data.recurrenceType as any,
        interval: data.interval,
        daysOfWeek: data.daysOfWeek ?? [],
        isActive: data.isActive ?? true,
      },
      include: {
        user: true,
        team: true,
        shiftType: true,
      },
    });
  }

  async findAll(companyId: string) {
    return this.prisma.shiftPattern.findMany({
      where: {
        companyId,
      },
      include: {
        user: true,
        team: true,
        shiftType: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(companyId: string, patternId: string, data: UpdateShiftPatternDto) {
    const existing = await this.prisma.shiftPattern.findFirst({
      where: {
        id: patternId,
        companyId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Shift pattern not found');
    }

    const nextTargetType = data.targetType ?? existing.targetType;
    const nextUserId = data.userId !== undefined ? data.userId : existing.userId ?? undefined;
    const nextTeamId = data.teamId !== undefined ? data.teamId : existing.teamId ?? undefined;
    const nextRecurrenceType = data.recurrenceType ?? existing.recurrenceType;
    const nextInterval = data.interval !== undefined ? data.interval : existing.interval ?? undefined;
    const nextDaysOfWeek =
      data.daysOfWeek !== undefined ? data.daysOfWeek : existing.daysOfWeek ?? [];

    this.validateTargetFields(nextTargetType, nextUserId, nextTeamId);
    this.validateRecurrence(nextRecurrenceType, nextInterval, nextDaysOfWeek);

    if (data.shiftTypeId) {
      const shiftType = await this.prisma.shiftType.findFirst({
        where: {
          id: data.shiftTypeId,
          companyId,
        },
      });

      if (!shiftType) {
        throw new NotFoundException('Shift type not found');
      }
    }

    if (nextUserId) {
      const user = await this.prisma.user.findFirst({
        where: {
          id: nextUserId,
          companyId,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }
    }

    if (nextTeamId) {
      const team = await this.prisma.team.findFirst({
        where: {
          id: nextTeamId,
          companyId,
        },
      });

      if (!team) {
        throw new NotFoundException('Team not found');
      }
    }

    return this.prisma.shiftPattern.update({
      where: {
        id: patternId,
      },
      data: {
        ...(data.targetType !== undefined && { targetType: data.targetType as any }),
        ...(data.userId !== undefined && { userId: data.userId || null }),
        ...(data.teamId !== undefined && { teamId: data.teamId || null }),
        ...(data.shiftTypeId !== undefined && { shiftTypeId: data.shiftTypeId }),
        ...(data.startDate !== undefined && { startDate: new Date(data.startDate) }),
        ...(data.endDate !== undefined && {
          endDate: data.endDate ? new Date(data.endDate) : null,
        }),
        ...(data.recurrenceType !== undefined && {
          recurrenceType: data.recurrenceType as any,
        }),
        ...(data.interval !== undefined && { interval: data.interval }),
        ...(data.daysOfWeek !== undefined && { daysOfWeek: data.daysOfWeek }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      include: {
        user: true,
        team: true,
        shiftType: true,
      },
    });
  }

  async remove(companyId: string, patternId: string) {
    const existing = await this.prisma.shiftPattern.findFirst({
      where: {
        id: patternId,
        companyId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Shift pattern not found');
    }

    await this.prisma.shiftPattern.delete({
      where: {
        id: patternId,
      },
    });

    return {
      message: 'Shift pattern deleted successfully',
    };
  }
}
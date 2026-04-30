import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type AuditAction =
  | 'USER_ROLE_UPDATED'
  | 'USER_ADDED_TO_TEAM'
  | 'USER_REMOVED_FROM_TEAM'
  | 'TEAM_LEAD_ASSIGNED'
  | 'TEAM_LEAD_REMOVED'
  | 'LEAVE_REQUEST_CREATED'
  | 'LEAVE_REQUEST_DELETED'
  | 'LEAVE_REQUEST_UPDATED'
  | 'SHIFT_PATTERN_GENERATED'
  | 'GENERATED_SHIFTS_REMOVED'
  | 'SHIFT_PATTERN_CREATED'
  | 'SHIFT_PATTERN_UPDATED'
  | 'SHIFT_PATTERN_DELETED'
  | 'SHIFT_PATTERN_GENERATED'

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    companyId: string;
    userId?: string;
    action: AuditAction;
    entityType: string;
    entityId?: string;
    metadata?: Record<string, any>;
    }) {
    return this.prisma.auditLog.create({
        data: {
        companyId: params.companyId,
        userId: params.userId,
        action: params.action,
        entity: params.entityType,
        entityId: params.entityId,
        details: params.metadata ?? {},
        },
    });
    }
}
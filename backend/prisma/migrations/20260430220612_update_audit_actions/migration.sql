-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'USER_ROLE_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'USER_ADDED_TO_TEAM';
ALTER TYPE "AuditAction" ADD VALUE 'USER_REMOVED_FROM_TEAM';
ALTER TYPE "AuditAction" ADD VALUE 'TEAM_LEAD_ASSIGNED';
ALTER TYPE "AuditAction" ADD VALUE 'TEAM_LEAD_REMOVED';
ALTER TYPE "AuditAction" ADD VALUE 'LEAVE_REQUEST_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'LEAVE_REQUEST_DELETED';
ALTER TYPE "AuditAction" ADD VALUE 'LEAVE_REQUEST_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'SHIFT_PATTERN_CREATED';
ALTER TYPE "AuditAction" ADD VALUE 'SHIFT_PATTERN_UPDATED';
ALTER TYPE "AuditAction" ADD VALUE 'SHIFT_PATTERN_DELETED';
ALTER TYPE "AuditAction" ADD VALUE 'SHIFT_PATTERN_GENERATED';
ALTER TYPE "AuditAction" ADD VALUE 'GENERATED_SHIFTS_REMOVED';

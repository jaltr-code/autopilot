-- CreateEnum
CREATE TYPE "ShiftTargetType" AS ENUM ('USER', 'TEAM');

-- CreateEnum
CREATE TYPE "RecurrenceType" AS ENUM ('NONE', 'DAILY', 'WEEKLY', 'EVERY_N_WEEKS');

-- AlterTable
ALTER TABLE "Shift" ADD COLUMN     "sourcePatternId" TEXT;

-- CreateTable
CREATE TABLE "ShiftPattern" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "targetType" "ShiftTargetType" NOT NULL,
    "userId" TEXT,
    "teamId" TEXT,
    "shiftTypeId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "recurrenceType" "RecurrenceType" NOT NULL DEFAULT 'NONE',
    "interval" INTEGER,
    "daysOfWeek" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShiftPattern_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShiftPattern_companyId_idx" ON "ShiftPattern"("companyId");

-- CreateIndex
CREATE INDEX "ShiftPattern_companyId_userId_idx" ON "ShiftPattern"("companyId", "userId");

-- CreateIndex
CREATE INDEX "ShiftPattern_companyId_teamId_idx" ON "ShiftPattern"("companyId", "teamId");

-- CreateIndex
CREATE INDEX "ShiftPattern_companyId_shiftTypeId_idx" ON "ShiftPattern"("companyId", "shiftTypeId");

-- CreateIndex
CREATE INDEX "Shift_companyId_sourcePatternId_idx" ON "Shift"("companyId", "sourcePatternId");

-- AddForeignKey
ALTER TABLE "Shift" ADD CONSTRAINT "Shift_sourcePatternId_fkey" FOREIGN KEY ("sourcePatternId") REFERENCES "ShiftPattern"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftPattern" ADD CONSTRAINT "ShiftPattern_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftPattern" ADD CONSTRAINT "ShiftPattern_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftPattern" ADD CONSTRAINT "ShiftPattern_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShiftPattern" ADD CONSTRAINT "ShiftPattern_shiftTypeId_fkey" FOREIGN KEY ("shiftTypeId") REFERENCES "ShiftType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

/*
  Warnings:

  - Added the required column `endDateTime` to the `Shift` table without a default value. This is not possible if the table is not empty.
  - Added the required column `startDateTime` to the `Shift` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "Shift_companyId_userId_date_key";

-- AlterTable
ALTER TABLE "Shift" ADD COLUMN     "endDateTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "startDateTime" TIMESTAMP(3) NOT NULL;

-- CreateIndex
CREATE INDEX "Shift_companyId_userId_startDateTime_idx" ON "Shift"("companyId", "userId", "startDateTime");

-- CreateIndex
CREATE INDEX "Shift_companyId_userId_endDateTime_idx" ON "Shift"("companyId", "userId", "endDateTime");

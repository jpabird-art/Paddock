-- CreateEnum
CREATE TYPE "TaskReadiness" AS ENUM ('NON_TASKWORTHY', 'LIMITED_ROLE', 'FULL_EXERCISE');

-- AlterTable
ALTER TABLE "horses" ADD COLUMN "taskReadiness" "TaskReadiness" NOT NULL DEFAULT 'FULL_EXERCISE';

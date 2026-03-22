-- AlterTable
ALTER TABLE "horse_moves" ADD COLUMN     "groupId" TEXT;

-- CreateIndex
CREATE INDEX "horse_moves_groupId_idx" ON "horse_moves"("groupId");

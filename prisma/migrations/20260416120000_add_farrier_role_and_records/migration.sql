-- AlterEnum: add FARRIER to Role
ALTER TYPE "Role" ADD VALUE 'FARRIER';

-- CreateTable: farrier_records
CREATE TABLE "farrier_records" (
    "id" TEXT NOT NULL,
    "horseId" TEXT NOT NULL,
    "serviceDate" TIMESTAMP(3) NOT NULL,
    "shoeType" TEXT,
    "hoofCondition" TEXT,
    "farrierName" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "farrier_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "farrier_records_horseId_serviceDate_idx" ON "farrier_records"("horseId", "serviceDate");

-- AddForeignKey
ALTER TABLE "farrier_records" ADD CONSTRAINT "farrier_records_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "horses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "farrier_records" ADD CONSTRAINT "farrier_records_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

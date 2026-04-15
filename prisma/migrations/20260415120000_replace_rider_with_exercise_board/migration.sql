-- DropTable: rider_assignments
DROP TABLE IF EXISTS "rider_assignments";

-- CreateTable: exercise_assignments
CREATE TABLE "exercise_assignments" (
    "id" TEXT NOT NULL,
    "horseId" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "exerciseName" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "duration" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercise_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable: exercise_notifications
CREATE TABLE "exercise_notifications" (
    "id" TEXT NOT NULL,
    "exerciseAssignmentId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedAt" TIMESTAMP(3),

    CONSTRAINT "exercise_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exercise_assignments_date_timeSlot_idx" ON "exercise_assignments"("date", "timeSlot");

-- CreateIndex
CREATE INDEX "exercise_assignments_horseId_date_idx" ON "exercise_assignments"("horseId", "date");

-- CreateIndex
CREATE INDEX "exercise_assignments_riderId_date_idx" ON "exercise_assignments"("riderId", "date");

-- AddForeignKey
ALTER TABLE "exercise_assignments" ADD CONSTRAINT "exercise_assignments_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "horses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_assignments" ADD CONSTRAINT "exercise_assignments_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_assignments" ADD CONSTRAINT "exercise_assignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_notifications" ADD CONSTRAINT "exercise_notifications_exerciseAssignmentId_fkey" FOREIGN KEY ("exerciseAssignmentId") REFERENCES "exercise_assignments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_notifications" ADD CONSTRAINT "exercise_notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

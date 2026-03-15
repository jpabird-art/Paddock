-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "serviceNumber" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'TROOPER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "horses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "regimentalNumber" TEXT NOT NULL,
    "breed" TEXT NOT NULL,
    "colour" TEXT NOT NULL,
    "dateOfBirth" DATETIME NOT NULL,
    "serviceEntryDate" DATETIME NOT NULL,
    "heightHands" REAL NOT NULL,
    "weightKg" REAL NOT NULL,
    "maxRiderWeightKg" REAL NOT NULL,
    "feedingNotes" TEXT NOT NULL,
    "dutyStation" TEXT NOT NULL DEFAULT 'HYDE_PARK_BARRACKS',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "photoUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "health_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "horseId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "scheduledAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    "notes" TEXT,
    "performedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "health_events_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "horses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "health_notes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "horseId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "health_notes_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "horses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "health_notes_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "injury_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "horseId" TEXT NOT NULL,
    "reportedById" TEXT NOT NULL,
    "resolvedById" TEXT,
    "severity" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "description" TEXT NOT NULL,
    "bodyLocation" TEXT NOT NULL,
    "reportedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    "resolutionNote" TEXT,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "injury_reports_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "horses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "injury_reports_reportedById_fkey" FOREIGN KEY ("reportedById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "injury_reports_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "injury_notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "injuryReportId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "sentAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledgedAt" DATETIME,
    CONSTRAINT "injury_notifications_injuryReportId_fkey" FOREIGN KEY ("injuryReportId") REFERENCES "injury_reports" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "injury_notifications_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "duty_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "horseId" TEXT NOT NULL,
    "assignedById" TEXT NOT NULL,
    "station" TEXT NOT NULL,
    "assignedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    CONSTRAINT "duty_assignments_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "horses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "duty_assignments_assignedById_fkey" FOREIGN KEY ("assignedById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "users_serviceNumber_key" ON "users"("serviceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "horses_regimentalNumber_key" ON "horses"("regimentalNumber");

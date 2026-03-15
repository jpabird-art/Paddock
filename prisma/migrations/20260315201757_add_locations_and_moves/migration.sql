-- CreateTable
CREATE TABLE "locations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "horse_moves" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "horseId" TEXT NOT NULL,
    "fromLocationId" TEXT,
    "toLocationId" TEXT NOT NULL,
    "departureDate" DATETIME NOT NULL,
    "arrivalDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "driverName" TEXT,
    "driverServiceNumber" TEXT,
    "boxGroomName" TEXT,
    "vehicleVRN" TEXT,
    "notes" TEXT,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "horse_moves_horseId_fkey" FOREIGN KEY ("horseId") REFERENCES "horses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "horse_moves_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "locations" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "horse_moves_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "locations" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "horse_moves_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "horse_moves_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_horses" (
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
    "currentLocationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "horses_currentLocationId_fkey" FOREIGN KEY ("currentLocationId") REFERENCES "locations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_horses" ("breed", "colour", "createdAt", "dateOfBirth", "dutyStation", "feedingNotes", "heightHands", "id", "isActive", "maxRiderWeightKg", "name", "photoUrl", "regimentalNumber", "serviceEntryDate", "updatedAt", "weightKg") SELECT "breed", "colour", "createdAt", "dateOfBirth", "dutyStation", "feedingNotes", "heightHands", "id", "isActive", "maxRiderWeightKg", "name", "photoUrl", "regimentalNumber", "serviceEntryDate", "updatedAt", "weightKg" FROM "horses";
DROP TABLE "horses";
ALTER TABLE "new_horses" RENAME TO "horses";
CREATE UNIQUE INDEX "horses_regimentalNumber_key" ON "horses"("regimentalNumber");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "locations_code_key" ON "locations"("code");

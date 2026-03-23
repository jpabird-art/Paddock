-- Horse indexes for list/dashboard queries
CREATE INDEX "horses_isActive_squadron_idx" ON "horses"("isActive", "squadron");
CREATE INDEX "horses_isActive_dutyStation_idx" ON "horses"("isActive", "dutyStation");
CREATE INDEX "horses_currentLocationId_idx" ON "horses"("currentLocationId");

-- Health event indexes
CREATE INDEX "health_events_horseId_status_idx" ON "health_events"("horseId", "status");
CREATE INDEX "health_events_status_scheduledAt_idx" ON "health_events"("status", "scheduledAt");

-- Injury report indexes
CREATE INDEX "injury_reports_horseId_status_idx" ON "injury_reports"("horseId", "status");
CREATE INDEX "injury_reports_status_reportedAt_idx" ON "injury_reports"("status", "reportedAt");

-- Duty assignment index
CREATE INDEX "duty_assignments_horseId_endDate_idx" ON "duty_assignments"("horseId", "endDate");

-- Horse move indexes
CREATE INDEX "horse_moves_horseId_departureDate_idx" ON "horse_moves"("horseId", "departureDate");
CREATE INDEX "horse_moves_status_departureDate_idx" ON "horse_moves"("status", "departureDate");

-- Attachment indexes
CREATE INDEX "attachments_horseId_createdAt_idx" ON "attachments"("horseId", "createdAt");
CREATE INDEX "attachments_injuryReportId_idx" ON "attachments"("injuryReportId");

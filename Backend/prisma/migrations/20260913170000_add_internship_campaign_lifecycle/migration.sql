-- An internship campaign has a one-month recruitment window followed by an
-- academic monitoring period. The actual company engagement remains separate.

CREATE TYPE "AcademicMonitoringStatus" AS ENUM ('PENDING', 'ACTIVE', 'CLOSED', 'CANCELLED');

ALTER TYPE "SemesterStatus" ADD VALUE 'RECRUITING';
ALTER TYPE "SemesterStatus" ADD VALUE 'MONITORING';

ALTER TABLE "InternshipPlacement"
  ADD COLUMN "academicClosedAt" TIMESTAMP(3),
  ADD COLUMN "academicStatus" "AcademicMonitoringStatus" NOT NULL DEFAULT 'PENDING';

UPDATE "InternshipPlacement"
SET "academicStatus" = CASE
  WHEN "status" = 'ACTIVE' THEN 'ACTIVE'::"AcademicMonitoringStatus"
  WHEN "status" = 'CANCELLED' THEN 'CANCELLED'::"AcademicMonitoringStatus"
  ELSE 'PENDING'::"AcademicMonitoringStatus"
END;

CREATE INDEX "InternshipPlacement_semesterId_academicStatus_idx"
  ON "InternshipPlacement"("semesterId", "academicStatus");

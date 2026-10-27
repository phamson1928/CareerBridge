-- Add per-side soft-delete / hide timestamps for finalized applications.
ALTER TABLE "Application"
  ADD COLUMN "hiddenByStudentAt" TIMESTAMP(3),
  ADD COLUMN "hiddenByCompanyAt" TIMESTAMP(3);

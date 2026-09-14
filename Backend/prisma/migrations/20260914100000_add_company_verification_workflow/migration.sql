-- Add a document-backed company verification workflow.

ALTER TYPE "CompanyStatus" RENAME TO "CompanyStatus_old";
CREATE TYPE "CompanyStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');
ALTER TABLE "CompanyProfile" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "CompanyProfile"
  ALTER COLUMN "status" TYPE "CompanyStatus"
  USING "status"::text::"CompanyStatus";
DROP TYPE "CompanyStatus_old";

ALTER TYPE "FileType" RENAME TO "FileType_old";
CREATE TYPE "FileType" AS ENUM ('CV', 'REPORT', 'CERTIFICATE', 'COMPANY_REGISTRATION', 'AVATAR');
ALTER TABLE "File"
  ALTER COLUMN "type" TYPE "FileType"
  USING "type"::text::"FileType";
DROP TYPE "FileType_old";

ALTER TABLE "CompanyProfile"
  ADD COLUMN "businessRegistrationNumber" TEXT,
  ADD COLUMN "contactPersonName" TEXT,
  ADD COLUMN "contactPhone" TEXT,
  ADD COLUMN "registrationDocumentFileId" TEXT,
  ADD COLUMN "submittedAt" TIMESTAMP(3),
  ADD COLUMN "suspensionReason" TEXT,
  ADD COLUMN "suspendedAt" TIMESTAMP(3),
  ALTER COLUMN "status" SET DEFAULT 'DRAFT';

UPDATE "CompanyProfile"
SET "status" = 'DRAFT'
WHERE "status" = 'PENDING'
  AND ("businessRegistrationNumber" IS NULL OR "registrationDocumentFileId" IS NULL);

CREATE UNIQUE INDEX "CompanyProfile_businessRegistrationNumber_key"
  ON "CompanyProfile"("businessRegistrationNumber");
CREATE UNIQUE INDEX "CompanyProfile_registrationDocumentFileId_key"
  ON "CompanyProfile"("registrationDocumentFileId");

ALTER TABLE "CompanyProfile"
  ADD CONSTRAINT "CompanyProfile_registrationDocumentFileId_fkey"
  FOREIGN KEY ("registrationDocumentFileId") REFERENCES "File"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

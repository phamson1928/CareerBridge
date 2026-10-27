-- CreateEnum
CREATE TYPE "CompanyRejectionReasonCode" AS ENUM ('MISSING_DOCUMENT', 'DOCUMENT_UNCLEAR', 'NAME_MISMATCH', 'REGISTRATION_MISMATCH', 'ADDRESS_MISMATCH', 'CONTACT_INVALID', 'OTHER');

-- CreateEnum
CREATE TYPE "CompanySuspensionReasonCode" AS ENUM ('POLICY_VIOLATION', 'FAKE_INFORMATION', 'ABUSIVE_POSTING', 'LEGAL_COMPLAINT', 'OTHER');

-- AlterTable
ALTER TABLE "CompanyProfile" ADD COLUMN     "rejectionReasonCode" "CompanyRejectionReasonCode",
ADD COLUMN     "reviewChecklist" JSONB,
ADD COLUMN     "reviewDueAt" TIMESTAMP(3),
ADD COLUMN     "suspensionReasonCode" "CompanySuspensionReasonCode";

-- AlterTable
ALTER TABLE "Internship" ADD COLUMN     "sourceInternshipId" TEXT,
ADD COLUMN     "sourceTemplateId" TEXT,
ADD COLUMN     "uniqueViewerCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "InternshipTemplate" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "department" TEXT,
    "location" TEXT,
    "workType" TEXT,
    "stipend" TEXT,
    "description" TEXT NOT NULL,
    "requirements" TEXT,
    "slotsDefault" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternshipTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternshipTemplateSkill" (
    "templateId" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "weight" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "InternshipTemplateSkill_pkey" PRIMARY KEY ("templateId","skillId")
);

-- CreateIndex
CREATE INDEX "InternshipTemplate_companyId_updatedAt_idx" ON "InternshipTemplate"("companyId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "InternshipTemplate_companyId_name_key" ON "InternshipTemplate"("companyId", "name");

-- CreateIndex
CREATE INDEX "InternshipTemplateSkill_skillId_idx" ON "InternshipTemplateSkill"("skillId");

-- CreateIndex
CREATE INDEX "CompanyProfile_status_reviewDueAt_idx" ON "CompanyProfile"("status", "reviewDueAt");

-- CreateIndex
CREATE INDEX "CompanyProfile_status_submittedAt_idx" ON "CompanyProfile"("status", "submittedAt");

-- CreateIndex
CREATE INDEX "Internship_sourceTemplateId_idx" ON "Internship"("sourceTemplateId");

-- CreateIndex
CREATE INDEX "Internship_sourceInternshipId_idx" ON "Internship"("sourceInternshipId");

-- AddForeignKey
ALTER TABLE "Internship" ADD CONSTRAINT "Internship_sourceTemplateId_fkey" FOREIGN KEY ("sourceTemplateId") REFERENCES "InternshipTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Internship" ADD CONSTRAINT "Internship_sourceInternshipId_fkey" FOREIGN KEY ("sourceInternshipId") REFERENCES "Internship"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternshipTemplate" ADD CONSTRAINT "InternshipTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternshipTemplateSkill" ADD CONSTRAINT "InternshipTemplateSkill_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "InternshipTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternshipTemplateSkill" ADD CONSTRAINT "InternshipTemplateSkill_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "InternshipModerationReasonCode" AS ENUM ('POLICY_VIOLATION', 'MISLEADING_INFO', 'UNAUTHORIZED_FEE', 'INAPPROPRIATE_CONTENT', 'OUTSIDE_MAJOR_SCOPE', 'OTHER');

-- CreateEnum
CREATE TYPE "InternshipReportReasonCode" AS ENUM ('FRAUD_SCAM', 'FEE_CHARGED', 'MISLEADING_DESCRIPTION', 'UNPROFESSIONAL_BEHAVIOR', 'OTHER');

-- CreateEnum
CREATE TYPE "InternshipReportStatus" AS ENUM ('PENDING', 'INVESTIGATING', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "AiScanStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'SKIPPED');

-- CreateEnum
CREATE TYPE "AiCandidateRecommendation" AS ENUM ('STRONG_HIRE', 'HIRE', 'POTENTIAL', 'NOT_RECOMMENDED');

-- AlterEnum
ALTER TYPE "InternshipStatus" ADD VALUE 'REJECTED';

-- AlterEnum
ALTER TYPE "NotificationAction" ADD VALUE 'OPEN_INTERNSHIP';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'INTERNSHIP';

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "aiScore" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "CompanyProfile" ADD COLUMN     "autoAiScanEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Internship" ADD COLUMN     "moderatedAt" TIMESTAMP(3),
ADD COLUMN     "moderatedById" TEXT,
ADD COLUMN     "moderationReason" TEXT,
ADD COLUMN     "moderationReasonCode" "InternshipModerationReasonCode";

-- CreateTable
CREATE TABLE "InternshipReport" (
    "id" TEXT NOT NULL,
    "internshipId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "reasonCode" "InternshipReportReasonCode" NOT NULL,
    "reasonDetail" TEXT,
    "status" "InternshipReportStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedById" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternshipReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiScanJob" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "status" "AiScanStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "maxAttempts" INTEGER NOT NULL DEFAULT 3,
    "lockedUntil" TIMESTAMP(3),
    "lockedByWorkerId" TEXT,
    "errorDetails" TEXT,
    "aiScore" DOUBLE PRECISION,
    "recommendation" "AiCandidateRecommendation",
    "experienceYears" DOUBLE PRECISION,
    "extractedSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "matchedSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "missingSkills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "strengths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "weaknesses" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "summary" TEXT,
    "rawAnalysis" JSONB,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiScanJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyAiWorker" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "modelName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyAiWorker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InternshipReport_internshipId_idx" ON "InternshipReport"("internshipId");

-- CreateIndex
CREATE INDEX "InternshipReport_studentId_idx" ON "InternshipReport"("studentId");

-- CreateIndex
CREATE INDEX "InternshipReport_status_idx" ON "InternshipReport"("status");

-- CreateIndex
CREATE INDEX "InternshipReport_status_createdAt_idx" ON "InternshipReport"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AiScanJob_applicationId_key" ON "AiScanJob"("applicationId");

-- CreateIndex
CREATE INDEX "AiScanJob_companyId_status_idx" ON "AiScanJob"("companyId", "status");

-- CreateIndex
CREATE INDEX "AiScanJob_status_lockedUntil_idx" ON "AiScanJob"("status", "lockedUntil");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyAiWorker_tokenHash_key" ON "CompanyAiWorker"("tokenHash");

-- CreateIndex
CREATE INDEX "CompanyAiWorker_companyId_idx" ON "CompanyAiWorker"("companyId");

-- CreateIndex
CREATE INDEX "Internship_moderationReasonCode_idx" ON "Internship"("moderationReasonCode");

-- AddForeignKey
ALTER TABLE "Internship" ADD CONSTRAINT "Internship_moderatedById_fkey" FOREIGN KEY ("moderatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternshipReport" ADD CONSTRAINT "InternshipReport_internshipId_fkey" FOREIGN KEY ("internshipId") REFERENCES "Internship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternshipReport" ADD CONSTRAINT "InternshipReport_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternshipReport" ADD CONSTRAINT "InternshipReport_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiScanJob" ADD CONSTRAINT "AiScanJob_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AiScanJob" ADD CONSTRAINT "AiScanJob_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyAiWorker" ADD CONSTRAINT "CompanyAiWorker_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "CompanyProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

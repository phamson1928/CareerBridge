-- Add interview invitation, offer workflow, and email logging for applications.

ALTER TYPE "ApplicationStatus" RENAME TO "ApplicationStatus_old";
CREATE TYPE "ApplicationStatus" AS ENUM (
  'PENDING',
  'REVIEWING',
  'INTERVIEWING',
  'OFFERED',
  'ACCEPTED',
  'DECLINED',
  'EXPIRED',
  'REJECTED',
  'WITHDRAWN'
);
ALTER TABLE "Application" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Application"
  ALTER COLUMN "status" TYPE "ApplicationStatus"
  USING "status"::text::"ApplicationStatus";
ALTER TABLE "ApplicationStatusHistory"
  ALTER COLUMN "fromStatus" TYPE "ApplicationStatus"
  USING "fromStatus"::text::"ApplicationStatus",
  ALTER COLUMN "toStatus" TYPE "ApplicationStatus"
  USING "toStatus"::text::"ApplicationStatus";
ALTER TABLE "Application" ALTER COLUMN "status" SET DEFAULT 'PENDING';
DROP TYPE "ApplicationStatus_old";

CREATE TYPE "InterviewMode" AS ENUM ('ONLINE', 'OFFLINE');

CREATE TYPE "EmailLogType" AS ENUM (
  'INTERVIEW_INVITATION',
  'OFFER_SENT',
  'OFFER_REMINDER',
  'OFFER_ACCEPTED_COMPANY',
  'OFFER_DECLINED_COMPANY',
  'OFFER_EXPIRED',
  'APPLICATION_REJECTED',
  'APPLICATION_WITHDRAWN_BY_PLACEMENT',
  'APPLICATION_CAMPAIGN_EXPIRED'
);

CREATE TYPE "EmailLogStatus" AS ENUM ('SENT', 'FAILED');

ALTER TABLE "Application"
  ADD COLUMN "rejectionReason" TEXT,
  ADD COLUMN "offeredAt" TIMESTAMP(3),
  ADD COLUMN "offerExpiresAt" TIMESTAMP(3),
  ADD COLUMN "offerMessage" TEXT,
  ADD COLUMN "offerReminderSentAt" TIMESTAMP(3),
  ADD COLUMN "respondedAt" TIMESTAMP(3);

CREATE INDEX "Application_status_offerExpiresAt_idx"
  ON "Application"("status", "offerExpiresAt");

CREATE TABLE "ApplicationInterview" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "scheduledAt" TIMESTAMP(3) NOT NULL,
  "mode" "InterviewMode" NOT NULL,
  "meetingLink" TEXT,
  "location" TEXT,
  "contactName" TEXT NOT NULL,
  "contactEmail" TEXT NOT NULL,
  "contactPhone" TEXT,
  "note" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ApplicationInterview_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ApplicationInterview_applicationId_key"
  ON "ApplicationInterview"("applicationId");

ALTER TABLE "ApplicationInterview"
  ADD CONSTRAINT "ApplicationInterview_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "Application"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "EmailLog" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "type" "EmailLogType" NOT NULL,
  "to" TEXT NOT NULL,
  "replyTo" TEXT,
  "subject" TEXT NOT NULL,
  "html" TEXT NOT NULL,
  "icsContent" TEXT,
  "status" "EmailLogStatus" NOT NULL,
  "error" TEXT,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EmailLog_applicationId_sentAt_idx"
  ON "EmailLog"("applicationId", "sentAt");

ALTER TABLE "EmailLog"
  ADD CONSTRAINT "EmailLog_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "Application"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

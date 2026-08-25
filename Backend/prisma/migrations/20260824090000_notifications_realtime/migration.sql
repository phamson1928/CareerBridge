-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('APPLICATION', 'REPORT', 'SUPERVISION', 'PLACEMENT', 'COMPANY', 'EVALUATION', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationAction" AS ENUM ('NONE', 'OPEN_APPLICATION', 'OPEN_REPORT', 'OPEN_SUPERVISION', 'OPEN_PLACEMENT', 'OPEN_COMPANY_PROFILE', 'OPEN_EVALUATION');

-- Preserve existing notification rows while introducing the new contract.
ALTER TABLE "Notification" ADD COLUMN "type" "NotificationType" NOT NULL DEFAULT 'SYSTEM';
ALTER TABLE "Notification" ADD COLUMN "action" "NotificationAction" NOT NULL DEFAULT 'NONE';
ALTER TABLE "Notification" ADD COLUMN "resourceId" TEXT;
ALTER TABLE "Notification" ADD COLUMN "metadata" JSONB;
ALTER TABLE "Notification" ADD COLUMN "eventKey" TEXT;

UPDATE "Notification"
SET "eventKey" = 'legacy:notification:' || "id"
WHERE "eventKey" IS NULL;

ALTER TABLE "Notification" ALTER COLUMN "eventKey" SET NOT NULL;
ALTER TABLE "Notification" ALTER COLUMN "content" SET DEFAULT '';
UPDATE "Notification" SET "content" = '' WHERE "content" IS NULL;
ALTER TABLE "Notification" ALTER COLUMN "content" SET NOT NULL;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_eventKey_key" UNIQUE ("eventKey");

-- New indexes support both the notification feed and unread badge.
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

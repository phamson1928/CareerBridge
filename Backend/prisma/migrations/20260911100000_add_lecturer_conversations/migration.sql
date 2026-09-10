ALTER TABLE "Conversation" ALTER COLUMN "applicationId" DROP NOT NULL;
ALTER TABLE "Conversation" ALTER COLUMN "companyId" DROP NOT NULL;
ALTER TABLE "Conversation" ADD COLUMN "placementId" TEXT;
ALTER TABLE "Conversation" ADD COLUMN "lecturerId" TEXT;

CREATE UNIQUE INDEX "Conversation_placementId_key" ON "Conversation"("placementId");
CREATE INDEX "Conversation_lecturerId_idx" ON "Conversation"("lecturerId");

ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_placementId_fkey"
  FOREIGN KEY ("placementId") REFERENCES "InternshipPlacement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_lecturerId_fkey"
  FOREIGN KEY ("lecturerId") REFERENCES "LecturerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

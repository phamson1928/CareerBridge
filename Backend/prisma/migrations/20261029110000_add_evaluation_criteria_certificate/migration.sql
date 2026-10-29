-- AlterTable
ALTER TABLE "Evaluation" ADD COLUMN "criteria" JSONB,
ADD COLUMN "certificateFileId" TEXT;

-- CreateIndex
CREATE INDEX "Evaluation_certificateFileId_idx" ON "Evaluation"("certificateFileId");

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_certificateFileId_fkey" FOREIGN KEY ("certificateFileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

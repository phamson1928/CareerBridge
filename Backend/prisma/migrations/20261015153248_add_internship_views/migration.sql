-- CreateTable
CREATE TABLE "InternshipView" (
    "id" TEXT NOT NULL,
    "internshipId" TEXT NOT NULL,
    "viewerUserId" TEXT NOT NULL,
    "firstViewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastViewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternshipView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InternshipView_internshipId_lastViewedAt_idx" ON "InternshipView"("internshipId", "lastViewedAt");

-- CreateIndex
CREATE UNIQUE INDEX "InternshipView_internshipId_viewerUserId_key" ON "InternshipView"("internshipId", "viewerUserId");

-- AddForeignKey
ALTER TABLE "InternshipView" ADD CONSTRAINT "InternshipView_internshipId_fkey" FOREIGN KEY ("internshipId") REFERENCES "Internship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternshipView" ADD CONSTRAINT "InternshipView_viewerUserId_fkey" FOREIGN KEY ("viewerUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

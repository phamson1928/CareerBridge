-- Checkpoint 1: Faculty / Major / InternshipMajor
-- Legacy text columns (StudentProfile.major, LecturerProfile.department) are kept for now
-- and will be dropped in Checkpoint 3 once all services use the new foreign keys.

-- CreateTable
CREATE TABLE "Faculty" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Faculty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Major" (
    "id" TEXT NOT NULL,
    "facultyId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Major_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternshipMajor" (
    "internshipId" TEXT NOT NULL,
    "majorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InternshipMajor_pkey" PRIMARY KEY ("internshipId","majorId")
);

-- AlterTable
ALTER TABLE "StudentProfile" ADD COLUMN "majorId" TEXT;

-- AlterTable
ALTER TABLE "LecturerProfile" ADD COLUMN "facultyId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Faculty_code_key" ON "Faculty"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Faculty_name_key" ON "Faculty"("name");

-- CreateIndex
CREATE INDEX "Faculty_isActive_idx" ON "Faculty"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Major_code_key" ON "Major"("code");

-- CreateIndex
CREATE INDEX "Major_facultyId_isActive_idx" ON "Major"("facultyId", "isActive");

-- CreateIndex
CREATE INDEX "Major_isActive_idx" ON "Major"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Major_facultyId_name_key" ON "Major"("facultyId", "name");

-- CreateIndex
CREATE INDEX "InternshipMajor_majorId_idx" ON "InternshipMajor"("majorId");

-- CreateIndex
CREATE INDEX "StudentProfile_majorId_idx" ON "StudentProfile"("majorId");

-- CreateIndex
CREATE INDEX "LecturerProfile_facultyId_idx" ON "LecturerProfile"("facultyId");

-- AddForeignKey
ALTER TABLE "StudentProfile" ADD CONSTRAINT "StudentProfile_majorId_fkey" FOREIGN KEY ("majorId") REFERENCES "Major"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LecturerProfile" ADD CONSTRAINT "LecturerProfile_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Major" ADD CONSTRAINT "Major_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternshipMajor" ADD CONSTRAINT "InternshipMajor_internshipId_fkey" FOREIGN KEY ("internshipId") REFERENCES "Internship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InternshipMajor" ADD CONSTRAINT "InternshipMajor_majorId_fkey" FOREIGN KEY ("majorId") REFERENCES "Major"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Add an avatar file reference to student and lecturer profiles.
ALTER TYPE "FileType" ADD VALUE IF NOT EXISTS 'AVATAR';

ALTER TABLE "StudentProfile" ADD COLUMN "avatarFileId" TEXT;
ALTER TABLE "LecturerProfile" ADD COLUMN "avatarFileId" TEXT;

CREATE UNIQUE INDEX "StudentProfile_avatarFileId_key" ON "StudentProfile"("avatarFileId");
CREATE UNIQUE INDEX "LecturerProfile_avatarFileId_key" ON "LecturerProfile"("avatarFileId");

ALTER TABLE "StudentProfile"
  ADD CONSTRAINT "StudentProfile_avatarFileId_fkey"
  FOREIGN KEY ("avatarFileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "LecturerProfile"
  ADD CONSTRAINT "LecturerProfile_avatarFileId_fkey"
  FOREIGN KEY ("avatarFileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "User" ADD COLUMN "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "permissions" TEXT[] NOT NULL DEFAULT '{}';

-- Existing ADMIN accounts become Super Admin by default
UPDATE "User" SET "isSuperAdmin" = true WHERE "role" = 'ADMIN';


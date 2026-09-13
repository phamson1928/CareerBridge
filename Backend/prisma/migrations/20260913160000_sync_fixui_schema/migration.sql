-- Synchronize the stored fixUI migration history with the Prisma schema used by
-- the email-verification feature in this revision.

ALTER TYPE "UserStatus" ADD VALUE 'PENDING_VERIFICATION';

ALTER TABLE "Notification" ALTER COLUMN "content" DROP DEFAULT,
ALTER COLUMN "type" DROP DEFAULT;

ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" TIMESTAMP(3),
ALTER COLUMN "status" SET DEFAULT 'PENDING_VERIFICATION';

CREATE TABLE "VerificationToken" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE INDEX "VerificationToken_userId_idx" ON "VerificationToken"("userId");
CREATE INDEX "VerificationToken_token_idx" ON "VerificationToken"("token");

ALTER TABLE "VerificationToken" ADD CONSTRAINT "VerificationToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

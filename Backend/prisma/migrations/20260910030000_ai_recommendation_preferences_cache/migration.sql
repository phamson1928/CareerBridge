-- CreateEnum
CREATE TYPE "RecommendationSource" AS ENUM ('AI_ENHANCED', 'DETERMINISTIC_FALLBACK', 'DETERMINISTIC_ONLY');

-- CreateTable
CREATE TABLE "StudentJobPreference" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "desiredRoles" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "preferredLocations" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "preferredWorkTypes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StudentJobPreference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InternshipRecommendationCache" (
    "id" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "fingerprint" VARCHAR(64) NOT NULL,
    "result" JSONB NOT NULL,
    "source" "RecommendationSource" NOT NULL,
    "model" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InternshipRecommendationCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StudentJobPreference_studentId_key" ON "StudentJobPreference"("studentId");
CREATE UNIQUE INDEX "InternshipRecommendationCache_studentId_key" ON "InternshipRecommendationCache"("studentId");
CREATE INDEX "InternshipRecommendationCache_expiresAt_idx" ON "InternshipRecommendationCache"("expiresAt");

-- AddForeignKey
ALTER TABLE "StudentJobPreference" ADD CONSTRAINT "StudentJobPreference_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "InternshipRecommendationCache" ADD CONSTRAINT "InternshipRecommendationCache_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "StudentProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

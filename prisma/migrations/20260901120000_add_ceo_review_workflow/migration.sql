-- AlterEnum
ALTER TYPE "ReportStatus" ADD VALUE 'ACTION_REQUIRED';
ALTER TYPE "ReportStatus" ADD VALUE 'RESOLVED';
ALTER TYPE "ReportStatus" ADD VALUE 'COMPLETED';
ALTER TYPE "ReportStatus" ADD VALUE 'SUCCESS';

-- AlterTable
ALTER TABLE "reports" ADD COLUMN "completedAt" TIMESTAMP(3),
ADD COLUMN "completedById" TEXT;

-- CreateTable
CREATE TABLE "recognition_rewards" (
    "id" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "reportId" TEXT,
    "rewardType" TEXT NOT NULL,
    "message" TEXT,
    "givenById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recognition_rewards_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_completedById_fkey" FOREIGN KEY ("completedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recognition_rewards" ADD CONSTRAINT "recognition_rewards_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recognition_rewards" ADD CONSTRAINT "recognition_rewards_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES "reports"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recognition_rewards" ADD CONSTRAINT "recognition_rewards_givenById_fkey" FOREIGN KEY ("givenById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "recognition_rewards_recipientId_idx" ON "recognition_rewards"("recipientId");

-- CreateIndex
CREATE INDEX "recognition_rewards_reportId_idx" ON "recognition_rewards"("reportId");

-- CreateIndex
CREATE INDEX "recognition_rewards_givenById_idx" ON "recognition_rewards"("givenById");

-- CreateIndex
CREATE INDEX "recognition_rewards_createdAt_idx" ON "recognition_rewards"("createdAt");

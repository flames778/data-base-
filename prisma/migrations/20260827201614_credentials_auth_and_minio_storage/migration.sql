-- DropIndex
DROP INDEX "User_entraId_key";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "entraId",
ADD COLUMN     "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "passwordHash" TEXT,
ADD COLUMN     "passwordResetExpiresAt" TIMESTAMP(3),
ADD COLUMN     "passwordResetToken" TEXT;

-- AlterTable
ALTER TABLE "document_versions" DROP COLUMN "sharepointItemId",
DROP COLUMN "sharepointPath",
ADD COLUMN     "storageKey" TEXT;

-- AlterTable
ALTER TABLE "documents" DROP COLUMN "sharepointDrive",
DROP COLUMN "sharepointItemId",
DROP COLUMN "sharepointPath",
ADD COLUMN     "storageKey" TEXT,
ADD COLUMN     "storageProvider" TEXT NOT NULL DEFAULT 'minio';

-- CreateIndex
CREATE UNIQUE INDEX "User_passwordResetToken_key" ON "User"("passwordResetToken");


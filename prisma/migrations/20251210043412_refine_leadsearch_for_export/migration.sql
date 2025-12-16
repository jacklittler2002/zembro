-- AlterTable
ALTER TABLE "LeadSearch" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "LeadSearch_userId_idx" ON "LeadSearch"("userId");

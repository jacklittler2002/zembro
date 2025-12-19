/*
  Warnings:

  - A unique constraint covering the columns `[userId,companyId,contactId,leadSearchId]` on the table `AIFeedback` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "LeadSearch" ADD COLUMN     "contactsFoundCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "crawledCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "discoveredCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "enrichedCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "AIFeedback_userId_companyId_contactId_leadSearchId_key" ON "AIFeedback"("userId", "companyId", "contactId", "leadSearchId");

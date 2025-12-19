-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "leadKey" TEXT;

-- AlterTable
ALTER TABLE "LeadSearch" ADD COLUMN     "creditsCharged" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalDeduped" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalFound" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "totalNetNew" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "CreditTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "leadSearchId" TEXT NOT NULL,
    "creditsDelta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "leadKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CreditTransaction_userId_idx" ON "CreditTransaction"("userId");

-- CreateIndex
CREATE INDEX "CreditTransaction_leadSearchId_idx" ON "CreditTransaction"("leadSearchId");

-- CreateIndex
CREATE INDEX "CreditTransaction_leadKey_idx" ON "CreditTransaction"("leadKey");

-- CreateIndex
CREATE INDEX "Contact_leadKey_idx" ON "Contact"("leadKey");

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_leadSearchId_fkey" FOREIGN KEY ("leadSearchId") REFERENCES "LeadSearch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CreditTransaction" ADD CONSTRAINT "CreditTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

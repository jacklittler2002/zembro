-- CreateTable
CREATE TABLE "LeadExport" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "contactId" TEXT,
    "leadSearchId" TEXT,
    "exportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadExport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LeadExport_userId_idx" ON "LeadExport"("userId");

-- CreateIndex
CREATE INDEX "LeadExport_companyId_idx" ON "LeadExport"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "LeadExport_userId_companyId_contactId_key" ON "LeadExport"("userId", "companyId", "contactId");

-- AddForeignKey
ALTER TABLE "LeadExport" ADD CONSTRAINT "LeadExport_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadExport" ADD CONSTRAINT "LeadExport_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadExport" ADD CONSTRAINT "LeadExport_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadExport" ADD CONSTRAINT "LeadExport_leadSearchId_fkey" FOREIGN KEY ("leadSearchId") REFERENCES "LeadSearch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

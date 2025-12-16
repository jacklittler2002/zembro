-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- Insert demo user for existing data
INSERT INTO "User" ("id", "email", "createdAt", "updatedAt")
VALUES ('demo-user-id', 'demo@zembro.local', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("id") DO NOTHING;

-- Update existing NULL userId values to demo-user-id
UPDATE "LeadSearch" SET "userId" = 'demo-user-id' WHERE "userId" IS NULL;

-- AlterTable: Make userId required and add foreign key for LeadSearch
ALTER TABLE "LeadSearch" ALTER COLUMN "userId" SET NOT NULL;
ALTER TABLE "LeadSearch" ADD CONSTRAINT "LeadSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable: Add foreign key for AiCreditWallet
ALTER TABLE "AiCreditWallet" ADD CONSTRAINT "AiCreditWallet_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex: Add unique constraint on AiCreditWallet userId
CREATE UNIQUE INDEX "AiCreditWallet_userId_key" ON "AiCreditWallet"("userId");

-- AlterTable: Add foreign key for TedConversation
ALTER TABLE "TedConversation" ADD CONSTRAINT "TedConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

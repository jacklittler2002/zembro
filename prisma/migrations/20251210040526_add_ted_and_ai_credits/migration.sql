-- CreateEnum
CREATE TYPE "TedMessageRole" AS ENUM ('user', 'assistant', 'system');

-- CreateTable
CREATE TABLE "AiCreditWallet" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "lastTopupAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiCreditWallet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AiCreditTransaction" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "change" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AiCreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TedConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TedConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TedMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "TedMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TedMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiCreditWallet_userId_idx" ON "AiCreditWallet"("userId");

-- CreateIndex
CREATE INDEX "AiCreditTransaction_walletId_idx" ON "AiCreditTransaction"("walletId");

-- CreateIndex
CREATE INDEX "TedConversation_userId_idx" ON "TedConversation"("userId");

-- CreateIndex
CREATE INDEX "TedMessage_conversationId_idx" ON "TedMessage"("conversationId");

-- AddForeignKey
ALTER TABLE "AiCreditTransaction" ADD CONSTRAINT "AiCreditTransaction_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "AiCreditWallet"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TedMessage" ADD CONSTRAINT "TedMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "TedConversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

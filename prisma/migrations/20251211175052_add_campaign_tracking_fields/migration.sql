-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "emailsFailed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "emailsSentToday" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "emailsUnsubscribed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lastResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "CampaignEmail" ADD COLUMN     "bounceType" TEXT,
ADD COLUMN     "error" TEXT,
ADD COLUMN     "messageId" TEXT,
ADD COLUMN     "unsubscribedAt" TIMESTAMP(3);

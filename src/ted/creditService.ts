import { prisma } from "../db";
import { logger } from "../logger";

/**
 * Custom error for credit-related issues
 */
export class CreditError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: { required?: number; available?: number }
  ) {
    super(message);
    this.name = "CreditError";
  }
}

/**
 * Get or create an AI credit wallet for a user.
 * New users start with 100 free credits.
 * Free users get a monthly refresh of 100 credits (capped at 100 total).
 */
export async function getOrCreateWalletForUser(userId: string) {
  let wallet = await prisma.aiCreditWallet.findUnique({
    where: { userId },
  });

  if (!wallet) {
    // New users start with 100 credits
    wallet = await prisma.aiCreditWallet.create({
      data: {
        userId,
        balance: 100,
        lastTopupAt: new Date(),
      },
    });
    
    // Record the initial credit grant
    await prisma.aiCreditTransaction.create({
      data: {
        walletId: wallet.id,
        change: 100,
        reason: "INITIAL_GRANT",
        metadata: { type: "new_user_bonus" },
      },
    });
    
    logger.info(`Created new AI credit wallet for user: ${userId} with 100 starting credits`);
  } else {
    // Check if free user needs monthly refresh
    await maybeRefreshFreeUserCredits(wallet);
  }

  return wallet;
}

/**
 * Refresh credits for free users (monthly cap at 100 total).
 * Free users get +100 credits per month, but capped at 100 max balance.
 */
async function maybeRefreshFreeUserCredits(wallet: any) {
  const now = new Date();
  const lastTopup = wallet.lastTopupAt || wallet.createdAt;
  const daysSinceTopup = (now.getTime() - lastTopup.getTime()) / (1000 * 60 * 60 * 24);
  
  // Check if it's been at least 30 days since last topup
  if (daysSinceTopup >= 30) {
    // Check if user is on a paid plan
    const user = await prisma.user.findUnique({
      where: { id: wallet.userId },
      include: {
        subscriptions: {
          where: { status: "active" },
          take: 1,
        },
      },
    });
    
    const hasPaidPlan = user?.subscriptions && user.subscriptions.length > 0;
    
    // Only cap free users at 100 credits
    if (!hasPaidPlan && wallet.balance < 100) {
      const topupAmount = Math.min(100, 100 - wallet.balance);
      
      if (topupAmount > 0) {
        await prisma.$transaction([
          prisma.aiCreditWallet.update({
            where: { id: wallet.id },
            data: { 
              balance: { increment: topupAmount },
              lastTopupAt: now,
            },
          }),
          prisma.aiCreditTransaction.create({
            data: {
              walletId: wallet.id,
              change: topupAmount,
              reason: "MONTHLY_REFRESH",
              metadata: { 
                type: "free_tier_topup",
                cappedAt: 100,
              },
            },
          }),
        ]);
        
        logger.info(`Monthly refresh: Added ${topupAmount} credits to free user ${wallet.userId} (capped at 100)`);
      }
    }
  }
}

/**
 * Get the current credit balance for a user.
 */
export async function getCreditBalance(userId: string): Promise<number> {
  const wallet = await getOrCreateWalletForUser(userId);
  return wallet.balance;
}

/**
 * Add credits to a user's wallet.
 * Creates a transaction record with the reason and optional metadata.
 */
export async function addCredits(
  userId: string,
  amount: number,
  reason: string,
  metadata?: Record<string, any>
): Promise<void> {
  if (amount <= 0) {
    throw new Error("Credit amount must be positive");
  }

  const wallet = await getOrCreateWalletForUser(userId);

  await prisma.$transaction([
    prisma.aiCreditWallet.update({
      where: { id: wallet.id },
      data: { balance: { increment: amount } },
    }),
    prisma.aiCreditTransaction.create({
      data: {
        walletId: wallet.id,
        change: amount,
        reason,
        metadata: metadata || {},
      },
    }),
  ]);

  logger.info(
    `Added ${amount} credits to user ${userId}. Reason: ${reason}`
  );
}

/**
 * Consume credits from a user's wallet.
 * Throws an error if insufficient credits.
 * Creates a transaction record with the reason and optional metadata.
 */
export async function consumeCredits(
  userId: string,
  amount: number,
  reason: string,
  metadata?: Record<string, any>
): Promise<void> {
  if (amount <= 0) {
    throw new Error("Credit amount must be positive");
  }

  const wallet = await getOrCreateWalletForUser(userId);

  if (wallet.balance < amount) {
    throw new CreditError(
      "INSUFFICIENT_CREDITS",
      `Insufficient credits. Required: ${amount}, Available: ${wallet.balance}`,
      {
        required: amount,
        available: wallet.balance,
      }
    );
  }

  await prisma.$transaction([
    prisma.aiCreditWallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: amount } },
    }),
    prisma.aiCreditTransaction.create({
      data: {
        walletId: wallet.id,
        change: -amount,
        reason,
        metadata: metadata || {},
      },
    }),
  ]);

  logger.info(
    `Consumed ${amount} credits from user ${userId}. Reason: ${reason}`
  );
}

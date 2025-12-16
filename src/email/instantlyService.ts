import { prisma } from "../db";
import { logger } from "../logger";
import { encrypt } from "./encryption";

/**
 * Webhook handler for Instantly email account provisioning
 * Called when Instantly finishes provisioning email accounts for a user
 */
export async function handleInstantlyWebhook(payload: {
  orderId: string;
  customerId: string; // Our userId
  accounts: Array<{
    email: string;
    domain: string;
    smtp: {
      host: string;
      port: number;
      username: string;
      password: string;
      secure: boolean;
    };
    imap: {
      host: string;
      port: number;
      username: string;
      password: string;
    };
    instantlyAccountId: string;
    warmupStatus: string;
  }>;
}) {
  logger.info("Received Instantly webhook", {
    orderId: payload.orderId,
    customerId: payload.customerId,
    accountCount: payload.accounts.length,
  });

  const createdAccounts = [];

  for (const account of payload.accounts) {
    try {
      // Check if account already exists
      const existing = await prisma.emailAccount.findUnique({
        where: { email: account.email },
      });

      if (existing) {
        logger.warn("Email account already exists, skipping", {
          email: account.email,
        });
        continue;
      }

      // Create email account with encrypted credentials
      const emailAccount = await prisma.emailAccount.create({
        data: {
          userId: payload.customerId,
          email: account.email,
          provider: "instantly",
          fromName: null,

          // SMTP config
          smtpHost: account.smtp.host,
          smtpPort: account.smtp.port,
          smtpUsername: account.smtp.username,
          smtpPassword: encrypt(account.smtp.password),
          smtpSecure: account.smtp.secure,

          // IMAP config
          imapHost: account.imap.host,
          imapPort: account.imap.port,
          imapUsername: account.imap.username,
          imapPassword: encrypt(account.imap.password),

          // Status & settings
          status: account.warmupStatus === "active" ? "WARMING_UP" : "ACTIVE",
          dailySendLimit: 50, // Instantly's recommended limit
          warmupEnabled: true,
          warmupStage: account.warmupStatus === "active" ? 1 : 0,
          warmupStartedAt: account.warmupStatus === "active" ? new Date() : null,

          // Instantly metadata
          instantlyAccountId: account.instantlyAccountId,
        },
      });

      createdAccounts.push(emailAccount);

      logger.info("Created email account from Instantly", {
        email: account.email,
        status: emailAccount.status,
      });
    } catch (error: any) {
      logger.error("Failed to create email account from Instantly", {
        email: account.email,
        error: error.message,
      });
    }
  }

  logger.info("Instantly webhook processing complete", {
    orderId: payload.orderId,
    accountsCreated: createdAccounts.length,
  });

  return {
    success: true,
    accountsCreated: createdAccounts.length,
    accounts: createdAccounts.map((acc) => ({
      id: acc.id,
      email: acc.email,
      status: acc.status,
    })),
  };
}

/**
 * Initiate purchase of email accounts via Instantly
 * (This would call Instantly's API - placeholder for now)
 */
export async function purchaseInstantlyAccounts(
  userId: string,
  quantity: number
): Promise<{
  orderId: string;
  status: string;
  estimatedTime: string;
}> {
  // TODO: Replace with actual Instantly API call when we have API key
  const instantlyApiKey = process.env.INSTANTLY_API_KEY;

  if (!instantlyApiKey) {
    throw new Error(
      "Instantly integration not configured. Please contact support or connect your own email accounts."
    );
  }

  // Placeholder for Instantly API call
  // const response = await fetch("https://api.instantly.ai/v1/accounts/purchase", {
  //   method: "POST",
  //   headers: {
  //     Authorization: `Bearer ${instantlyApiKey}`,
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({
  //     quantity,
  //     customerId: userId,
  //     webhookUrl: `${process.env.BASE_URL}/api/webhooks/instantly`,
  //   }),
  // });

  logger.info("Instantly account purchase initiated", {
    userId,
    quantity,
  });

  // Return mock data for now
  return {
    orderId: `order_${Date.now()}`,
    status: "provisioning",
    estimatedTime: "15-30 minutes",
  };
}

/**
 * Check if Instantly integration is available
 */
export function isInstantlyEnabled(): boolean {
  return !!process.env.INSTANTLY_API_KEY;
}

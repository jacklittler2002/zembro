import nodemailer from "nodemailer";
import { prisma } from "../db";
import { logger } from "../logger";
import { encrypt, decrypt } from "./encryption";

export interface EmailAccountConfig {
  email: string;
  provider: "gmail" | "outlook" | "smtp" | "instantly";
  fromName?: string;

  // SMTP
  smtpHost: string;
  smtpPort: number;
  smtpUsername: string;
  smtpPassword: string;
  smtpSecure?: boolean;

  // IMAP (optional, for reply detection)
  imapHost?: string;
  imapPort?: number;
  imapUsername?: string;
  imapPassword?: string;

  // Settings
  dailySendLimit?: number;
  warmupEnabled?: boolean;
}

/**
 * Test SMTP connection to verify credentials work
 */
export async function testSmtpConnection(config: {
  host: string;
  port: number;
  username: string;
  password: string;
  secure?: boolean;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure ?? config.port === 465,
      auth: {
        user: config.username,
        pass: config.password,
      },
      // Increase timeout for slow SMTP servers
      connectionTimeout: 10000,
    });

    await transporter.verify();

    logger.info("SMTP connection test successful", {
      host: config.host,
      username: config.username,
    });

    return { success: true };
  } catch (error: any) {
    logger.error("SMTP connection test failed", {
      host: config.host,
      error: error.message,
    });

    return {
      success: false,
      error: error.message || "Failed to connect to SMTP server",
    };
  }
}

/**
 * Add a new email account for a user (BYOE - Bring Your Own Email)
 */
export async function addEmailAccount(
  userId: string,
  config: EmailAccountConfig
) {
  // First, test the connection
  const testResult = await testSmtpConnection({
    host: config.smtpHost,
    port: config.smtpPort,
    username: config.smtpUsername,
    password: config.smtpPassword,
    ...(config.smtpSecure !== undefined && { secure: config.smtpSecure }),
  });

  if (!testResult.success) {
    throw new Error(`SMTP connection failed: ${testResult.error}`);
  }

  // Encrypt sensitive credentials
  const encryptedSmtpPassword = encrypt(config.smtpPassword);
  const encryptedImapPassword = config.imapPassword
    ? encrypt(config.imapPassword)
    : null;

  // Create email account in database
  const emailAccount = await prisma.emailAccount.create({
    data: {
      userId,
      email: config.email,
      provider: config.provider,
      fromName: config.fromName || null,

      smtpHost: config.smtpHost,
      smtpPort: config.smtpPort,
      smtpUsername: config.smtpUsername,
      smtpPassword: encryptedSmtpPassword,
      smtpSecure: config.smtpSecure ?? config.smtpPort === 465,

      imapHost: config.imapHost || null,
      imapPort: config.imapPort || null,
      imapUsername: config.imapUsername || null,
      imapPassword: encryptedImapPassword,

      status: "ACTIVE", // Connection already verified
      dailySendLimit: config.dailySendLimit || 50,
      warmupEnabled: config.warmupEnabled ?? false,
    },
  });

  logger.info("Email account added successfully", {
    userId,
    email: config.email,
    provider: config.provider,
  });

  return emailAccount;
}

/**
 * Get decrypted SMTP credentials for sending
 */
export async function getSmtpCredentials(emailAccountId: string) {
  const account = await prisma.emailAccount.findUnique({
    where: { id: emailAccountId },
  });

  if (!account) {
    throw new Error("Email account not found");
  }

  if (account.status !== "ACTIVE" && account.status !== "WARMING_UP") {
    throw new Error(`Email account is ${account.status}, cannot send`);
  }

  return {
    email: account.email,
    fromName: account.fromName,
    smtpHost: account.smtpHost,
    smtpPort: account.smtpPort,
    smtpUsername: account.smtpUsername,
    smtpPassword: decrypt(account.smtpPassword),
    smtpSecure: account.smtpSecure,
  };
}

/**
 * Get all email accounts for a user
 */
export async function getUserEmailAccounts(userId: string) {
  return await prisma.emailAccount.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Delete an email account
 */
export async function deleteEmailAccount(userId: string, emailAccountId: string) {
  const account = await prisma.emailAccount.findFirst({
    where: {
      id: emailAccountId,
      userId, // Ensure user owns this account
    },
  });

  if (!account) {
    throw new Error("Email account not found or unauthorized");
  }

  await prisma.emailAccount.delete({
    where: { id: emailAccountId },
  });

  logger.info("Email account deleted", {
    userId,
    emailAccountId,
    email: account.email,
  });
}

/**
 * Update email account status
 */
export async function updateEmailAccountStatus(
  emailAccountId: string,
  status: "ACTIVE" | "PAUSED" | "WARMING_UP" | "FAILED" | "SUSPENDED"
) {
  await prisma.emailAccount.update({
    where: { id: emailAccountId },
    data: { status },
  });

  logger.info("Email account status updated", {
    emailAccountId,
    status,
  });
}

/**
 * Increment daily sent count and check limits
 */
export async function trackEmailSent(emailAccountId: string) {
  const account = await prisma.emailAccount.findUnique({
    where: { id: emailAccountId },
  });

  if (!account) {
    throw new Error("Email account not found");
  }

  // Check if we need to reset daily counter (new day)
  const now = new Date();
  const lastReset = account.lastResetAt;
  const daysSinceReset = Math.floor(
    (now.getTime() - lastReset.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceReset >= 1) {
    // Reset counter for new day
    await prisma.emailAccount.update({
      where: { id: emailAccountId },
      data: {
        dailySentCount: 1,
        lastSentAt: now,
        lastResetAt: now,
        totalSent: { increment: 1 },
      },
    });
    return { withinLimit: true, remaining: account.dailySendLimit - 1 };
  }

  // Check if we're at the limit
  if (account.dailySentCount >= account.dailySendLimit) {
    return {
      withinLimit: false,
      remaining: 0,
      error: `Daily send limit reached (${account.dailySendLimit})`,
    };
  }

  // Increment counter
  await prisma.emailAccount.update({
    where: { id: emailAccountId },
    data: {
      dailySentCount: { increment: 1 },
      lastSentAt: now,
      totalSent: { increment: 1 },
    },
  });

  return {
    withinLimit: true,
    remaining: account.dailySendLimit - (account.dailySentCount + 1),
  };
}

/**
 * Get provider presets for common email services
 */
export function getProviderPreset(
  provider: "gmail" | "outlook"
): {
  smtpHost: string;
  smtpPort: number;
  imapHost: string;
  imapPort: number;
} {
  const presets = {
    gmail: {
      smtpHost: "smtp.gmail.com",
      smtpPort: 587,
      imapHost: "imap.gmail.com",
      imapPort: 993,
    },
    outlook: {
      smtpHost: "smtp-mail.outlook.com",
      smtpPort: 587,
      imapHost: "outlook.office365.com",
      imapPort: 993,
    },
  };

  return presets[provider];
}

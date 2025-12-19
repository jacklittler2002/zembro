import { prisma } from "../db";
import { logger } from "../logger";
import { generateLeadKey, hasLeadBeenDelivered } from "./leadKeyUtils";

export interface LeadDeliveryResult {
  totalFound: number;
  totalDeduped: number;
  totalNetNew: number;
  creditsCharged: number;
  deliveredLeads: Array<{
    contactId: string;
    leadKey: string;
    isNetNew: boolean;
  }>;
}

/**
 * Instantly-style credit charging service.
 * Charges ONLY for net-new unique leads delivered to the user.
 */
export class InstantlyCreditService {
  /**
   * Process leads for delivery and charge credits only for net-new leads.
   * This should be called after leads are found but before they're delivered to the user.
   */
  static async processLeadDelivery(
    userId: string,
    leadSearchId: string,
    contacts: Array<{
      id: string;
      email: string;
      company: {
        id: string;
        domain?: string | null;
        websiteUrl?: string | null;
        name: string;
        city?: string | null;
        country?: string | null;
        googleMapsPlaceId?: string | null;
      };
    }>
  ): Promise<LeadDeliveryResult> {
    const result: LeadDeliveryResult = {
      totalFound: contacts.length,
      totalDeduped: 0,
      totalNetNew: 0,
      creditsCharged: 0,
      deliveredLeads: [],
    };

    // Process each contact
    for (const contact of contacts) {
      const leadKey = generateLeadKey({
        email: contact.email,
        company: contact.company,
      });

      // Check if this lead has already been delivered to this user
      const alreadyDelivered = await hasLeadBeenDelivered(userId, leadKey);

      if (alreadyDelivered) {
        result.totalDeduped++;
        result.deliveredLeads.push({
          contactId: contact.id,
          leadKey,
          isNetNew: false,
        });
      } else {
        // Net-new lead - charge 1 credit
        result.totalNetNew++;
        result.creditsCharged++;

        result.deliveredLeads.push({
          contactId: contact.id,
          leadKey,
          isNetNew: true,
        });
      }
    }

    // If we have net-new leads, charge credits and create transactions
    if (result.totalNetNew > 0) {
      await this.chargeCreditsForLeads(userId, leadSearchId, result.deliveredLeads);
    }

    // Update lead search statistics
    await this.updateLeadSearchStats(leadSearchId, result);

    logger.info("Processed lead delivery", {
      userId,
      leadSearchId,
      ...result,
    });

    return result;
  }

  /**
   * Charge credits for net-new leads and create audit trail
   */
  private static async chargeCreditsForLeads(
    userId: string,
    leadSearchId: string,
    deliveredLeads: Array<{ contactId: string; leadKey: string; isNetNew: boolean }>
  ): Promise<void> {
    const netNewLeads = deliveredLeads.filter(lead => lead.isNetNew);

    if (netNewLeads.length === 0) {
      return;
    }

    // Get user's credit wallet
    const wallet = await prisma.aiCreditWallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new Error(`No credit wallet found for user ${userId}`);
    }

    if (wallet.balance < netNewLeads.length) {
      throw new Error(`Insufficient credits. Required: ${netNewLeads.length}, Available: ${wallet.balance}`);
    }

    // Charge credits in a transaction
    await prisma.$transaction(async (tx) => {
      // Deduct from wallet
      await tx.aiCreditWallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: netNewLeads.length } },
      });

      // Create credit transactions for each lead
      for (const lead of netNewLeads) {
        await tx.creditTransaction.create({
          data: {
            userId,
            leadSearchId,
            creditsDelta: -1, // Negative for charges
            reason: "lead_delivered",
            leadKey: lead.leadKey,
          },
        });

        // Update contact with lead key
        await tx.contact.update({
          where: { id: lead.contactId },
          data: { leadKey: lead.leadKey },
        });
      }

      // Record the wallet transaction
      await tx.aiCreditTransaction.create({
        data: {
          walletId: wallet.id,
          change: -netNewLeads.length,
          reason: "LEAD_SEARCH_DELIVERY",
          metadata: {
            leadSearchId,
            netNewLeads: netNewLeads.length,
            leadKeys: netNewLeads.map(l => l.leadKey),
          },
        },
      });
    });

    logger.info("Charged credits for net-new leads", {
      userId,
      leadSearchId,
      creditsCharged: netNewLeads.length,
      leadKeys: netNewLeads.map(l => l.leadKey),
    });
  }

  /**
   * Update lead search statistics
   */
  private static async updateLeadSearchStats(
    leadSearchId: string,
    result: LeadDeliveryResult
  ): Promise<void> {
    await prisma.leadSearch.update({
      where: { id: leadSearchId },
      data: {
        totalFound: { increment: result.totalFound },
        totalDeduped: { increment: result.totalDeduped },
        totalNetNew: { increment: result.totalNetNew },
        creditsCharged: { increment: result.creditsCharged },
      },
    });
  }

  /**
   * Refund credits for a lead (e.g., if lead is invalid or removed)
   */
  static async refundLeadCredit(
    userId: string,
    leadSearchId: string,
    leadKey: string
  ): Promise<void> {
    const wallet = await prisma.aiCreditWallet.findUnique({
      where: { userId },
    });

    if (!wallet) {
      throw new Error(`No credit wallet found for user ${userId}`);
    }

    // Check if this lead was actually charged
    const chargeTransaction = await prisma.creditTransaction.findFirst({
      where: {
        userId,
        leadSearchId,
        leadKey,
        creditsDelta: -1,
      },
    });

    if (!chargeTransaction) {
      logger.warn("Attempted to refund lead that was never charged", {
        userId,
        leadSearchId,
        leadKey,
      });
      return;
    }

    // Check if already refunded
    const refundTransaction = await prisma.creditTransaction.findFirst({
      where: {
        userId,
        leadSearchId,
        leadKey,
        creditsDelta: 1,
        reason: "refund",
      },
    });

    if (refundTransaction) {
      logger.warn("Lead already refunded", {
        userId,
        leadSearchId,
        leadKey,
      });
      return;
    }

    // Process refund
    await prisma.$transaction(async (tx) => {
      // Credit back to wallet
      await tx.aiCreditWallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: 1 } },
      });

      // Create refund transaction
      await tx.creditTransaction.create({
        data: {
          userId,
          leadSearchId,
          creditsDelta: 1, // Positive for refunds
          reason: "refund",
          leadKey,
        },
      });

      // Record wallet transaction
      await tx.aiCreditTransaction.create({
        data: {
          walletId: wallet.id,
          change: 1,
          reason: "LEAD_REFUND",
          metadata: {
            leadSearchId,
            leadKey,
            originalChargeId: chargeTransaction.id,
          },
        },
      });
    });

    logger.info("Refunded credit for lead", {
      userId,
      leadSearchId,
      leadKey,
    });
  }
}
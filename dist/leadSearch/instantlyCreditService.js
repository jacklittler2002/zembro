"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InstantlyCreditService = void 0;
const db_1 = require("../db");
const logger_1 = require("../logger");
const leadKeyUtils_1 = require("./leadKeyUtils");
/**
 * Instantly-style credit charging service.
 * Charges ONLY for net-new unique leads delivered to the user.
 */
class InstantlyCreditService {
    /**
     * Process leads for delivery and charge credits only for net-new leads.
     * This should be called after leads are found but before they're delivered to the user.
     */
    static async processLeadDelivery(userId, leadSearchId, contacts) {
        const result = {
            totalFound: contacts.length,
            totalDeduped: 0,
            totalNetNew: 0,
            creditsCharged: 0,
            deliveredLeads: [],
        };
        // Process each contact
        for (const contact of contacts) {
            const leadKey = (0, leadKeyUtils_1.generateLeadKey)({
                email: contact.email,
                company: contact.company,
            });
            // Check if this lead has already been delivered to this user
            const alreadyDelivered = await (0, leadKeyUtils_1.hasLeadBeenDelivered)(userId, leadKey);
            if (alreadyDelivered) {
                result.totalDeduped++;
                result.deliveredLeads.push({
                    contactId: contact.id,
                    leadKey,
                    isNetNew: false,
                });
            }
            else {
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
        logger_1.logger.info("Processed lead delivery", {
            userId,
            leadSearchId,
            ...result,
        });
        return result;
    }
    /**
     * Charge credits for net-new leads and create audit trail
     */
    static async chargeCreditsForLeads(userId, leadSearchId, deliveredLeads) {
        const netNewLeads = deliveredLeads.filter(lead => lead.isNetNew);
        if (netNewLeads.length === 0) {
            return;
        }
        // Get user's credit wallet
        const wallet = await db_1.prisma.aiCreditWallet.findUnique({
            where: { userId },
        });
        if (!wallet) {
            throw new Error(`No credit wallet found for user ${userId}`);
        }
        if (wallet.balance < netNewLeads.length) {
            throw new Error(`Insufficient credits. Required: ${netNewLeads.length}, Available: ${wallet.balance}`);
        }
        // Charge credits in a transaction
        await db_1.prisma.$transaction(async (tx) => {
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
        logger_1.logger.info("Charged credits for net-new leads", {
            userId,
            leadSearchId,
            creditsCharged: netNewLeads.length,
            leadKeys: netNewLeads.map(l => l.leadKey),
        });
    }
    /**
     * Update lead search statistics
     */
    static async updateLeadSearchStats(leadSearchId, result) {
        await db_1.prisma.leadSearch.update({
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
    static async refundLeadCredit(userId, leadSearchId, leadKey) {
        const wallet = await db_1.prisma.aiCreditWallet.findUnique({
            where: { userId },
        });
        if (!wallet) {
            throw new Error(`No credit wallet found for user ${userId}`);
        }
        // Check if this lead was actually charged
        const chargeTransaction = await db_1.prisma.creditTransaction.findFirst({
            where: {
                userId,
                leadSearchId,
                leadKey,
                creditsDelta: -1,
            },
        });
        if (!chargeTransaction) {
            logger_1.logger.warn("Attempted to refund lead that was never charged", {
                userId,
                leadSearchId,
                leadKey,
            });
            return;
        }
        // Check if already refunded
        const refundTransaction = await db_1.prisma.creditTransaction.findFirst({
            where: {
                userId,
                leadSearchId,
                leadKey,
                creditsDelta: 1,
                reason: "refund",
            },
        });
        if (refundTransaction) {
            logger_1.logger.warn("Lead already refunded", {
                userId,
                leadSearchId,
                leadKey,
            });
            return;
        }
        // Process refund
        await db_1.prisma.$transaction(async (tx) => {
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
        logger_1.logger.info("Refunded credit for lead", {
            userId,
            leadSearchId,
            leadKey,
        });
    }
}
exports.InstantlyCreditService = InstantlyCreditService;
//# sourceMappingURL=instantlyCreditService.js.map
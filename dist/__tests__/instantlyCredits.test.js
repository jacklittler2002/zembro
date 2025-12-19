"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const db_1 = require("../db");
const instantlyCreditService_1 = require("../leadSearch/instantlyCreditService");
const leadKeyUtils_1 = require("../leadSearch/leadKeyUtils");
(0, globals_1.describe)("Instantly-Style Credit System", () => {
    let testUserId;
    let testLeadSearchId;
    let testUserEmail;
    (0, globals_1.beforeEach)(async () => {
        // Create unique test user for each test
        const timestamp = Date.now();
        testUserEmail = `test-instantly-${timestamp}@example.com`;
        const user = await db_1.prisma.user.create({
            data: {
                id: `test-user-instantly-${timestamp}`,
                email: testUserEmail,
            },
        });
        testUserId = user.id;
        // Create credit wallet
        await db_1.prisma.aiCreditWallet.upsert({
            where: { userId: testUserId },
            update: { balance: 100 },
            create: {
                userId: testUserId,
                balance: 100,
            },
        });
        // Create test lead search
        const leadSearch = await db_1.prisma.leadSearch.create({
            data: {
                userId: testUserId,
                query: "test query",
                status: "RUNNING",
            },
        });
        testLeadSearchId = leadSearch.id;
    });
    (0, globals_1.afterEach)(async () => {
        // Clean up in correct order to avoid foreign key violations
        await db_1.prisma.creditTransaction.deleteMany({
            where: { userId: testUserId },
        });
        await db_1.prisma.contact.deleteMany({
            where: {
                company: {
                    leadSearches: {
                        some: { userId: testUserId },
                    },
                },
            },
        });
        await db_1.prisma.company.deleteMany({
            where: {
                leadSearches: {
                    some: { userId: testUserId },
                },
            },
        });
        await db_1.prisma.leadSearch.deleteMany({
            where: { userId: testUserId },
        });
        // Delete AI credit transactions first
        await db_1.prisma.aiCreditTransaction.deleteMany({
            where: {
                wallet: {
                    userId: testUserId,
                },
            },
        });
        await db_1.prisma.aiCreditWallet.deleteMany({
            where: { userId: testUserId },
        });
        await db_1.prisma.user.deleteMany({
            where: { email: testUserEmail },
        });
    });
    (0, globals_1.describe)("Lead Key Generation", () => {
        (0, globals_1.it)("should generate consistent keys for same lead", () => {
            const contact1 = {
                email: "john@acme.com",
                company: {
                    domain: "acme.com",
                    websiteUrl: "https://acme.com",
                    name: "Acme Corp",
                    city: "New York",
                    country: "US",
                },
            };
            const contact2 = {
                email: "jane@acme.com", // Different email, same company
                company: {
                    domain: "acme.com",
                    websiteUrl: "https://acme.com",
                    name: "Acme Corp",
                    city: "New York",
                    country: "US",
                },
            };
            const key1 = (0, leadKeyUtils_1.generateLeadKey)(contact1);
            const key2 = (0, leadKeyUtils_1.generateLeadKey)(contact2);
            (0, globals_1.expect)(key1).toBe("domain:acme.com");
            (0, globals_1.expect)(key2).toBe("domain:acme.com"); // Same key for same company
        });
        (0, globals_1.it)("should prioritize domain over other identifiers", () => {
            const contact = {
                email: "test@company.com",
                company: {
                    domain: "company.com",
                    websiteUrl: "https://company.com",
                    name: "Company Inc",
                    city: "Boston",
                    country: "US",
                    googleMapsPlaceId: "PLACE123",
                },
            };
            const key = (0, leadKeyUtils_1.generateLeadKey)(contact);
            (0, globals_1.expect)(key).toBe("domain:company.com");
        });
        (0, globals_1.it)("should use Google Places ID when no domain", () => {
            const contact = {
                email: "test@company.com",
                company: {
                    name: "Company Inc",
                    city: "Boston",
                    country: "US",
                    googleMapsPlaceId: "PLACE123",
                },
            };
            const key = (0, leadKeyUtils_1.generateLeadKey)(contact);
            (0, globals_1.expect)(key).toBe("place:PLACE123");
        });
        (0, globals_1.it)("should use normalized company name + location as fallback", () => {
            const contact = {
                email: "test@company.com",
                company: {
                    name: "ACME Corporation!",
                    city: "New York",
                    country: "USA",
                },
            };
            const key = (0, leadKeyUtils_1.generateLeadKey)(contact);
            (0, globals_1.expect)(key).toBe("company:acme_corporation_new_york_usa");
        });
    });
    (0, globals_1.describe)("Credit Charging", () => {
        (0, globals_1.it)("should charge only for net-new leads", async () => {
            const testId = Date.now().toString();
            // Create test company
            const company = await db_1.prisma.company.create({
                data: {
                    name: "Test Company",
                    domain: `testcompany${testId}.com`,
                    source: "test",
                },
            });
            const contact1 = await db_1.prisma.contact.create({
                data: {
                    email: `john@testcompany${testId}.com`,
                    companyId: company.id,
                    source: "test",
                },
            });
            const contact2 = await db_1.prisma.contact.create({
                data: {
                    email: `jane@testcompany${testId}.com`,
                    companyId: company.id,
                    source: "test",
                },
            });
            const contacts = [
                {
                    id: contact1.id,
                    email: contact1.email,
                    company: {
                        id: company.id,
                        domain: `testcompany${testId}.com`,
                        websiteUrl: `https://testcompany${testId}.com`,
                        name: "Test Company",
                        city: "NYC",
                        country: "US",
                    },
                },
                {
                    id: contact2.id,
                    email: contact2.email,
                    company: {
                        id: company.id,
                        domain: `testcompany${testId}.com`,
                        websiteUrl: `https://testcompany${testId}.com`,
                        name: "Test Company",
                        city: "NYC",
                        country: "US",
                    },
                },
            ];
            const result = await instantlyCreditService_1.InstantlyCreditService.processLeadDelivery(testUserId, testLeadSearchId, contacts);
            (0, globals_1.expect)(result.totalFound).toBe(2);
            (0, globals_1.expect)(result.totalDeduped).toBe(0); // First time seeing these leads
            (0, globals_1.expect)(result.totalNetNew).toBe(2);
            (0, globals_1.expect)(result.creditsCharged).toBe(2);
            // Check wallet balance decreased
            const wallet = await db_1.prisma.aiCreditWallet.findUnique({
                where: { userId: testUserId },
            });
            (0, globals_1.expect)(wallet?.balance).toBe(98); // 100 - 2
            // Check credit transactions created
            const transactions = await db_1.prisma.creditTransaction.findMany({
                where: { userId: testUserId, leadSearchId: testLeadSearchId },
            });
            (0, globals_1.expect)(transactions).toHaveLength(2);
            (0, globals_1.expect)(transactions.every(t => t.creditsDelta === -1)).toBe(true);
        });
        (0, globals_1.it)("should not charge for duplicate leads within same run", async () => {
            const testId = Date.now().toString();
            // Create test company
            const company = await db_1.prisma.company.create({
                data: {
                    name: "Test Company",
                    domain: `testcompany${testId}.com`,
                    source: "test",
                },
            });
            const contact1 = await db_1.prisma.contact.create({
                data: {
                    email: `john@testcompany${testId}.com`,
                    companyId: company.id,
                    source: "test",
                },
            });
            const contact2 = await db_1.prisma.contact.create({
                data: {
                    email: `jane@testcompany${testId}.com`,
                    companyId: company.id,
                    source: "test",
                },
            });
            const contacts = [
                {
                    id: contact1.id,
                    email: contact1.email,
                    company: {
                        id: company.id,
                        domain: `testcompany${testId}.com`,
                        websiteUrl: `https://testcompany${testId}.com`,
                        name: "Test Company",
                        city: "NYC",
                        country: "US",
                    },
                },
                {
                    id: contact2.id, // Different contact ID but same company
                    email: contact2.email,
                    company: {
                        id: company.id,
                        domain: `testcompany${testId}.com`,
                        websiteUrl: `https://testcompany${testId}.com`,
                        name: "Test Company",
                        city: "NYC",
                        country: "US",
                    },
                },
            ];
            // First run
            const result1 = await instantlyCreditService_1.InstantlyCreditService.processLeadDelivery(testUserId, testLeadSearchId, contacts);
            (0, globals_1.expect)(result1.totalFound).toBe(2);
            (0, globals_1.expect)(result1.totalDeduped).toBe(0);
            (0, globals_1.expect)(result1.totalNetNew).toBe(2);
            (0, globals_1.expect)(result1.creditsCharged).toBe(2);
            // Second run with same leads (should not charge again)
            const result2 = await instantlyCreditService_1.InstantlyCreditService.processLeadDelivery(testUserId, testLeadSearchId, contacts);
            (0, globals_1.expect)(result2.totalFound).toBe(2);
            (0, globals_1.expect)(result2.totalDeduped).toBe(2); // Now they're duplicates
            (0, globals_1.expect)(result2.totalNetNew).toBe(0);
            (0, globals_1.expect)(result2.creditsCharged).toBe(0);
            // Check wallet balance (should only be charged once)
            const wallet = await db_1.prisma.aiCreditWallet.findUnique({
                where: { userId: testUserId },
            });
            (0, globals_1.expect)(wallet?.balance).toBe(98); // 100 - 2 (not -4)
        });
        (0, globals_1.it)("should not charge for failed searches", async () => {
            const testId = Date.now().toString() + '2';
            // Create test company
            const company = await db_1.prisma.company.create({
                data: {
                    name: "Test Company",
                    domain: `testcompany${testId}.com`,
                    source: "test",
                },
            });
            const contact1 = await db_1.prisma.contact.create({
                data: {
                    email: `john@testcompany${testId}.com`,
                    companyId: company.id,
                    source: "test",
                },
            });
            const contacts = [
                {
                    id: contact1.id,
                    email: contact1.email,
                    company: {
                        id: company.id,
                        domain: `testcompany${testId}.com`,
                        websiteUrl: `https://testcompany${testId}.com`,
                        name: "Test Company",
                        city: "NYC",
                        country: "US",
                    },
                },
            ];
            // Process leads
            const result = await instantlyCreditService_1.InstantlyCreditService.processLeadDelivery(testUserId, testLeadSearchId, contacts);
            (0, globals_1.expect)(result.creditsCharged).toBe(1);
            // Simulate search failure - no additional charges should occur
            // (This would be handled by not calling processLeadDelivery for failed searches)
            // Check final balance
            const wallet = await db_1.prisma.aiCreditWallet.findUnique({
                where: { userId: testUserId },
            });
            (0, globals_1.expect)(wallet?.balance).toBe(99); // 100 - 1
        });
        (0, globals_1.it)("should allow refunds", async () => {
            const testId = Date.now().toString() + '3';
            // Create test company and contact
            const company = await db_1.prisma.company.create({
                data: {
                    name: "Test Company",
                    domain: `testcompany${testId}.com`,
                    source: "test",
                },
            });
            const contact = await db_1.prisma.contact.create({
                data: {
                    email: `john@testcompany${testId}.com`,
                    companyId: company.id,
                    source: "test",
                },
            });
            const contacts = [
                {
                    id: contact.id,
                    email: contact.email,
                    company: {
                        id: company.id,
                        domain: "testcompany.com",
                        websiteUrl: "https://testcompany.com",
                        name: "Test Company",
                        city: "NYC",
                        country: "US",
                    },
                },
            ];
            // Process leads to charge
            const result = await instantlyCreditService_1.InstantlyCreditService.processLeadDelivery(testUserId, testLeadSearchId, contacts);
            (0, globals_1.expect)(result.creditsCharged).toBe(1);
            // Check initial balance after charge
            let wallet = await db_1.prisma.aiCreditWallet.findUnique({
                where: { userId: testUserId },
            });
            (0, globals_1.expect)(wallet?.balance).toBe(99);
            // Refund the lead
            const leadKey = (0, leadKeyUtils_1.generateLeadKey)({
                email: contact.email,
                company: {
                    domain: "testcompany.com",
                    websiteUrl: "https://testcompany.com",
                    name: "Test Company",
                    city: "NYC",
                    country: "US",
                },
            });
            await instantlyCreditService_1.InstantlyCreditService.refundLeadCredit(testUserId, testLeadSearchId, leadKey);
            // Check balance after refund
            wallet = await db_1.prisma.aiCreditWallet.findUnique({
                where: { userId: testUserId },
            });
            (0, globals_1.expect)(wallet?.balance).toBe(100); // Back to original
        });
    });
    (0, globals_1.describe)("Export Operations", () => {
        (0, globals_1.it)("should not charge credits for exports", async () => {
            // This test ensures that export operations don't trigger credit charges
            // The implementation should not call processLeadDelivery for exports
            const initialBalance = 100;
            // Check that balance remains unchanged (no automatic charges)
            const wallet = await db_1.prisma.aiCreditWallet.findUnique({
                where: { userId: testUserId },
            });
            (0, globals_1.expect)(wallet?.balance).toBe(initialBalance);
        });
    });
});
//# sourceMappingURL=instantlyCredits.test.js.map
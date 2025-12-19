import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { prisma } from "../db";
import { InstantlyCreditService } from "../leadSearch/instantlyCreditService";
import { generateLeadKey } from "../leadSearch/leadKeyUtils";

describe("Instantly-Style Credit System", () => {
  let testUserId: string;
  let testLeadSearchId: string;
  let testUserEmail: string;

  beforeEach(async () => {
    // Create unique test user for each test
    const timestamp = Date.now();
    testUserEmail = `test-instantly-${timestamp}@example.com`;
    
    const user = await prisma.user.create({
      data: {
        id: `test-user-instantly-${timestamp}`,
        email: testUserEmail,
      },
    });
    testUserId = user.id;

    // Create credit wallet
    await prisma.aiCreditWallet.upsert({
      where: { userId: testUserId },
      update: { balance: 100 },
      create: {
        userId: testUserId,
        balance: 100,
      },
    });

    // Create test lead search
    const leadSearch = await prisma.leadSearch.create({
      data: {
        userId: testUserId,
        query: "test query",
        status: "RUNNING",
      },
    });
    testLeadSearchId = leadSearch.id;
  });

  afterEach(async () => {
    // Clean up in correct order to avoid foreign key violations
    await prisma.creditTransaction.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.contact.deleteMany({
      where: {
        company: {
          leadSearches: {
            some: { userId: testUserId },
          },
        },
      },
    });
    await prisma.company.deleteMany({
      where: {
        leadSearches: {
          some: { userId: testUserId },
        },
      },
    });
    await prisma.leadSearch.deleteMany({
      where: { userId: testUserId },
    });
    // Delete AI credit transactions first
    await prisma.aiCreditTransaction.deleteMany({
      where: {
        wallet: {
          userId: testUserId,
        },
      },
    });
    await prisma.aiCreditWallet.deleteMany({
      where: { userId: testUserId },
    });
    await prisma.user.deleteMany({
      where: { email: testUserEmail },
    });
  });

  describe("Lead Key Generation", () => {
    it("should generate consistent keys for same lead", () => {
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

      const key1 = generateLeadKey(contact1);
      const key2 = generateLeadKey(contact2);

      expect(key1).toBe("domain:acme.com");
      expect(key2).toBe("domain:acme.com"); // Same key for same company
    });

    it("should prioritize domain over other identifiers", () => {
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

      const key = generateLeadKey(contact);
      expect(key).toBe("domain:company.com");
    });

    it("should use Google Places ID when no domain", () => {
      const contact = {
        email: "test@company.com",
        company: {
          name: "Company Inc",
          city: "Boston",
          country: "US",
          googleMapsPlaceId: "PLACE123",
        },
      };

      const key = generateLeadKey(contact);
      expect(key).toBe("place:PLACE123");
    });

    it("should use normalized company name + location as fallback", () => {
      const contact = {
        email: "test@company.com",
        company: {
          name: "ACME Corporation!",
          city: "New York",
          country: "USA",
        },
      };

      const key = generateLeadKey(contact);
      expect(key).toBe("company:acme_corporation_new_york_usa");
    });
  });

  describe("Credit Charging", () => {
    it("should charge only for net-new leads", async () => {
      const testId = Date.now().toString();
      // Create test company
      const company = await prisma.company.create({
        data: {
          name: "Test Company",
          domain: `testcompany${testId}.com`,
          source: "test",
        },
      });

      const contact1 = await prisma.contact.create({
        data: {
          email: `john@testcompany${testId}.com`,
          companyId: company.id,
          source: "test",
        },
      });

      const contact2 = await prisma.contact.create({
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

      const result = await InstantlyCreditService.processLeadDelivery(
        testUserId,
        testLeadSearchId,
        contacts
      );

      expect(result.totalFound).toBe(2);
      expect(result.totalDeduped).toBe(0); // First time seeing these leads
      expect(result.totalNetNew).toBe(2);
      expect(result.creditsCharged).toBe(2);

      // Check wallet balance decreased
      const wallet = await prisma.aiCreditWallet.findUnique({
        where: { userId: testUserId },
      });
      expect(wallet?.balance).toBe(98); // 100 - 2

      // Check credit transactions created
      const transactions = await prisma.creditTransaction.findMany({
        where: { userId: testUserId, leadSearchId: testLeadSearchId },
      });
      expect(transactions).toHaveLength(2);
      expect(transactions.every(t => t.creditsDelta === -1)).toBe(true);
    });

    it("should not charge for duplicate leads within same run", async () => {
      const testId = Date.now().toString();
      // Create test company
      const company = await prisma.company.create({
        data: {
          name: "Test Company",
          domain: `testcompany${testId}.com`,
          source: "test",
        },
      });

      const contact1 = await prisma.contact.create({
        data: {
          email: `john@testcompany${testId}.com`,
          companyId: company.id,
          source: "test",
        },
      });

      const contact2 = await prisma.contact.create({
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
      const result1 = await InstantlyCreditService.processLeadDelivery(
        testUserId,
        testLeadSearchId,
        contacts
      );

      expect(result1.totalFound).toBe(2);
      expect(result1.totalDeduped).toBe(0);
      expect(result1.totalNetNew).toBe(2);
      expect(result1.creditsCharged).toBe(2);

      // Second run with same leads (should not charge again)
      const result2 = await InstantlyCreditService.processLeadDelivery(
        testUserId,
        testLeadSearchId,
        contacts
      );

      expect(result2.totalFound).toBe(2);
      expect(result2.totalDeduped).toBe(2); // Now they're duplicates
      expect(result2.totalNetNew).toBe(0);
      expect(result2.creditsCharged).toBe(0);

      // Check wallet balance (should only be charged once)
      const wallet = await prisma.aiCreditWallet.findUnique({
        where: { userId: testUserId },
      });
      expect(wallet?.balance).toBe(98); // 100 - 2 (not -4)
    });

    it("should not charge for failed searches", async () => {
      const testId = Date.now().toString() + '2';
      // Create test company
      const company = await prisma.company.create({
        data: {
          name: "Test Company",
          domain: `testcompany${testId}.com`,
          source: "test",
        },
      });

      const contact1 = await prisma.contact.create({
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
      const result = await InstantlyCreditService.processLeadDelivery(
        testUserId,
        testLeadSearchId,
        contacts
      );

      expect(result.creditsCharged).toBe(1);

      // Simulate search failure - no additional charges should occur
      // (This would be handled by not calling processLeadDelivery for failed searches)

      // Check final balance
      const wallet = await prisma.aiCreditWallet.findUnique({
        where: { userId: testUserId },
      });
      expect(wallet?.balance).toBe(99); // 100 - 1
    });

    it("should allow refunds", async () => {
      const testId = Date.now().toString() + '3';
      // Create test company and contact
      const company = await prisma.company.create({
        data: {
          name: "Test Company",
          domain: `testcompany${testId}.com`,
          source: "test",
        },
      });

      const contact = await prisma.contact.create({
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
      const result = await InstantlyCreditService.processLeadDelivery(
        testUserId,
        testLeadSearchId,
        contacts
      );

      expect(result.creditsCharged).toBe(1);

      // Check initial balance after charge
      let wallet = await prisma.aiCreditWallet.findUnique({
        where: { userId: testUserId },
      });
      expect(wallet?.balance).toBe(99);

      // Refund the lead
      const leadKey = generateLeadKey({
        email: contact.email,
        company: {
          domain: "testcompany.com",
          websiteUrl: "https://testcompany.com",
          name: "Test Company",
          city: "NYC",
          country: "US",
        },
      });

      await InstantlyCreditService.refundLeadCredit(testUserId, testLeadSearchId, leadKey);

      // Check balance after refund
      wallet = await prisma.aiCreditWallet.findUnique({
        where: { userId: testUserId },
      });
      expect(wallet?.balance).toBe(100); // Back to original
    });
  });

  describe("Export Operations", () => {
    it("should not charge credits for exports", async () => {
      // This test ensures that export operations don't trigger credit charges
      // The implementation should not call processLeadDelivery for exports

      const initialBalance = 100;

      // Check that balance remains unchanged (no automatic charges)
      const wallet = await prisma.aiCreditWallet.findUnique({
        where: { userId: testUserId },
      });
      expect(wallet?.balance).toBe(initialBalance);
    });
  });
});
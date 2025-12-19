import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { PolicyRegistry } from '../policies/policyRegistry';
import { PolicyEnforcer } from '../policies/policyEnforcer';
import { UserPolicy } from '../policies/basePolicies';

describe('Policy System', () => {
  let mockPrisma: any;

  beforeEach(() => {
    // Mock Prisma client
    mockPrisma = {
      user: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
      },
      leadSearch: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    // Reset PolicyRegistry before each test
    (PolicyRegistry as any).enforcer = null;
  });

  describe('PolicyRegistry', () => {
    it('should initialize policies successfully', () => {
      expect(() => {
        PolicyRegistry.initialize(mockPrisma);
      }).not.toThrow();

      const enforcer = PolicyRegistry.getEnforcer();
      expect(enforcer).toBeInstanceOf(PolicyEnforcer);
    });

    it('should return the same enforcer instance', () => {
      PolicyRegistry.initialize(mockPrisma);
      const enforcer1 = PolicyRegistry.getEnforcer();
      const enforcer2 = PolicyRegistry.getEnforcer();

      expect(enforcer1).toBe(enforcer2);
    });
  });

  describe('UserPolicy', () => {
    let userPolicy: UserPolicy;

    beforeEach(() => {
      userPolicy = new UserPolicy();
    });

    it('should allow user to read their own record', async () => {
      const context = {
        userId: 'user-123',
        action: 'read',
        resource: { id: 'user-123' },
        prisma: mockPrisma,
      };

      const result = await userPolicy.check(context);
      expect(result.allowed).toBe(true);
    });

    it('should deny user to read another user record', async () => {
      const context = {
        userId: 'user-123',
        action: 'read',
        resource: { id: 'user-456' },
        prisma: mockPrisma,
      };

      const result = await userPolicy.check(context);
      expect(result.allowed).toBe(false);
      expect(result.reason).toContain('Users can only access their own data');
    });
  });
});
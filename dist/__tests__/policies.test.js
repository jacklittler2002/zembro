"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const policyRegistry_1 = require("../policies/policyRegistry");
const policyEnforcer_1 = require("../policies/policyEnforcer");
const basePolicies_1 = require("../policies/basePolicies");
(0, globals_1.describe)('Policy System', () => {
    let mockPrisma;
    (0, globals_1.beforeEach)(() => {
        // Mock Prisma client
        mockPrisma = {
            user: {
                findUnique: globals_1.jest.fn(),
                findMany: globals_1.jest.fn(),
            },
            leadSearch: {
                findUnique: globals_1.jest.fn(),
                findMany: globals_1.jest.fn(),
                count: globals_1.jest.fn(),
            },
        };
        // Reset PolicyRegistry before each test
        policyRegistry_1.PolicyRegistry.enforcer = null;
    });
    (0, globals_1.describe)('PolicyRegistry', () => {
        (0, globals_1.it)('should initialize policies successfully', () => {
            (0, globals_1.expect)(() => {
                policyRegistry_1.PolicyRegistry.initialize(mockPrisma);
            }).not.toThrow();
            const enforcer = policyRegistry_1.PolicyRegistry.getEnforcer();
            (0, globals_1.expect)(enforcer).toBeInstanceOf(policyEnforcer_1.PolicyEnforcer);
        });
        (0, globals_1.it)('should return the same enforcer instance', () => {
            policyRegistry_1.PolicyRegistry.initialize(mockPrisma);
            const enforcer1 = policyRegistry_1.PolicyRegistry.getEnforcer();
            const enforcer2 = policyRegistry_1.PolicyRegistry.getEnforcer();
            (0, globals_1.expect)(enforcer1).toBe(enforcer2);
        });
    });
    (0, globals_1.describe)('UserPolicy', () => {
        let userPolicy;
        (0, globals_1.beforeEach)(() => {
            userPolicy = new basePolicies_1.UserPolicy();
        });
        (0, globals_1.it)('should allow user to read their own record', async () => {
            const context = {
                userId: 'user-123',
                action: 'read',
                resource: { id: 'user-123' },
                prisma: mockPrisma,
            };
            const result = await userPolicy.check(context);
            (0, globals_1.expect)(result.allowed).toBe(true);
        });
        (0, globals_1.it)('should deny user to read another user record', async () => {
            const context = {
                userId: 'user-123',
                action: 'read',
                resource: { id: 'user-456' },
                prisma: mockPrisma,
            };
            const result = await userPolicy.check(context);
            (0, globals_1.expect)(result.allowed).toBe(false);
            (0, globals_1.expect)(result.reason).toContain('Users can only access their own data');
        });
    });
});
//# sourceMappingURL=policies.test.js.map
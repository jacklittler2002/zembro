"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
// Setup test environment
(0, globals_1.beforeAll)(async () => {
    // Any global setup can go here
});
(0, globals_1.afterAll)(async () => {
    // Any global cleanup can go here
});
// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:aKlKDz03kQPbNnVa@db.ltsdqqpcmizhaiodlmmf.supabase.co:5432/postgres';
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy';
// Global test utilities
global.testUserId = 'test-user-123';
global.testUserEmail = 'test@example.com';
//# sourceMappingURL=setup.js.map
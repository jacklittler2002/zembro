import { beforeAll, afterAll } from '@jest/globals';

declare global {
  var testUserId: string;
  var testUserEmail: string;
}

// Setup test environment
beforeAll(async () => {
  // Any global setup can go here
});

afterAll(async () => {
  // Any global cleanup can go here
});

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:aKlKDz03kQPbNnVa@db.ltsdqqpcmizhaiodlmmf.supabase.co:5432/postgres';
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy';

// Global test utilities
global.testUserId = 'test-user-123';
global.testUserEmail = 'test@example.com';
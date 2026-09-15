import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: resolve(__dirname, '../.env') });

// The suites wipe every table before running. They must never touch the real
// learning database, so they only run against TEST_DATABASE_URL.
const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error('TEST_DATABASE_URL is not set. Tests delete all data, so they refuse to use DATABASE_URL.');
}
if (testDatabaseUrl === process.env.DATABASE_URL && /neon\.tech/.test(testDatabaseUrl)) {
  throw new Error('TEST_DATABASE_URL points at the same Neon database as DATABASE_URL. Use a separate database or branch.');
}

export default defineConfig({
  test: {
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    fileParallelism: false,
    testTimeout: 30000,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: testDatabaseUrl,
      DIRECT_URL: testDatabaseUrl,
      SPRACHWEG_USER_ID: 'guest-user-001',
    },
  },
});

import { defineConfig, configDefaults } from 'vitest/config';

// Unit tests (run by npm test and by GitHub Actions). They never connect to a database.
// Fake values let the app load without a real database.
export default defineConfig({
  test: {
    environment: 'node',
    exclude: [...configDefaults.exclude, 'tests/integration/**'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgres://user:fake-password@localhost:5432/not_used',
      JWT_SECRET: 'test-only-secret',
      CLIENT_URL: 'http://localhost:5173',
    },
  },
});